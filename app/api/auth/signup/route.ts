import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { badRequest, readJsonObject } from "@/lib/validation";

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,24}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  if (!body) return badRequest("Invalid request body");
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!USERNAME_RE.test(username)) {
    return NextResponse.json(
      { error: "Username must be 3-24 characters (letters, numbers, _ or -)" },
      { status: 400 }
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }
  // bcrypt silently ignores everything past 72 bytes.
  if (new TextEncoder().encode(password).length > 72) {
    return NextResponse.json({ error: "Password must be at most 72 bytes" }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Username or email is already taken" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  let user;
  try {
    user = await prisma.user.create({
      data: { username, email, passwordHash },
    });
  } catch (err) {
    // Lost a race with a concurrent signup for the same username/email.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "Username or email is already taken" }, { status: 409 });
    }
    throw err;
  }

  await createSession(user.id);

  return NextResponse.json({ username: user.username, email: user.email }, { status: 201 });
}
