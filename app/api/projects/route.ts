import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: { name: true },
  });
  return NextResponse.json({ projects: projects.map((p) => p.name) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Project name is required" }, { status: 400 });
  }

  const project = await prisma.project.upsert({
    where: { userId_name: { userId: user.id, name } },
    update: {},
    create: { name, userId: user.id },
  });

  return NextResponse.json({ name: project.name }, { status: 201 });
}
