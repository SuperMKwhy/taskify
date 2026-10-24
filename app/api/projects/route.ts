import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { LIMITS, badRequest, readJsonObject, str, unauthorized } from "@/lib/validation";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: { name: true },
  });
  return NextResponse.json({ projects: projects.map((p) => p.name) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await readJsonObject(request);
  if (!body) return badRequest("Invalid request body");

  const name = str(body.name);
  if (!name) return badRequest("Project name is required");
  if (name.length > LIMITS.project) {
    return badRequest(`Project names are limited to ${LIMITS.project} characters`);
  }

  const project = await prisma.project.upsert({
    where: { userId_name: { userId: user.id, name } },
    update: {},
    create: { name, userId: user.id },
  });

  return NextResponse.json({ name: project.name }, { status: 201 });
}
