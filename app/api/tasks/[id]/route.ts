import { NextResponse } from "next/server";
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

  if (typeof body.completed !== "boolean") {
    return NextResponse.json(
      { error: "completed must be a boolean" },
      { status: 400 }
    );
  }

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const task = await prisma.task.update({
    where: { id },
    data: { completed: body.completed },
    include: { project: true },
  });

  return NextResponse.json(serializeTask(task));
}
