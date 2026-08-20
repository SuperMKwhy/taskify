import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { serializeTask } from "@/lib/serializeTask";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data: Prisma.TaskUpdateInput = {};

  if (typeof body.completed === "boolean") {
    data.completed = body.completed;
  }

  const editsFields =
    typeof body.title === "string" ||
    typeof body.description === "string" ||
    typeof body.dueDate === "string" ||
    typeof body.project === "string";

  if (editsFields) {
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

    data.title = title;
    data.description = description || null;
    data.dueDate = new Date(`${dueDate}T00:00:00.000Z`);
    data.project = {
      connectOrCreate: {
        where: { userId_name: { userId: user.id, name: project } },
        create: { name: project, userId: user.id },
      },
    };
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const task = await prisma.task.update({
    where: { id },
    data,
    include: { project: true },
  });

  return NextResponse.json(serializeTask(task));
}
