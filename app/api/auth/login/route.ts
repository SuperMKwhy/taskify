import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { badRequest, readJsonObject } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  if (!body) return badRequest("Invalid request body");
  const identifier = typeof body.identifier === "string" ? body.identifier.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  const invalid = () =>
    NextResponse.json({ error: "Invalid username/email or password" }, { status: 401 });

  if (!identifier || !password) return invalid();

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: identifier },
        { email: identifier.toLowerCase() },
      ],
    },
  });
  if (!user) return invalid();

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return invalid();

  await createSession(user.id);

  return NextResponse.json({ username: user.username, email: user.email });
}
