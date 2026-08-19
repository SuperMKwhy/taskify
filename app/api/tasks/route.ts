import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeTask } from "@/lib/serializeTask";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tasks = await prisma.task.findMany({
    where: { userId: user.id },
    include: { project: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(tasks.map(serializeTask));
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const project = typeof body.project === "string" ? body.project.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const dueDate = typeof body.dueDate === "string" ? body.dueDate : "";

  if (!project || !title || !dueDate) {
    return NextResponse.json(
      { error: "project, title, and dueDate are required" },
      { status: 400 }
    );
  }

  const task = await prisma.task.create({
    data: {
      title,
      description: description || null,
      dueDate: new Date(`${dueDate}T00:00:00.000Z`),
      user: { connect: { id: user.id } },
      project: {
        connectOrCreate: {
          where: { userId_name: { userId: user.id, name: project } },
          create: { name: project, userId: user.id },
        },
      },
    },
    include: { project: true },
  });

  return NextResponse.json(serializeTask(task), { status: 201 });
}
