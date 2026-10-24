import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { serializeTask } from "@/lib/serializeTask";
import { getCurrentUser } from "@/lib/auth";
import { badRequest, parseTaskFields, readJsonObject, unauthorized } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

function notFound() {
  return NextResponse.json({ error: "Task not found" }, { status: 404 });
}

export async function PATCH(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const body = await readJsonObject(request);
  if (!body) return badRequest("Invalid request body");

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) return notFound();

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
    const fields = parseTaskFields(body);
    if (typeof fields === "string") return badRequest(fields);

    data.title = fields.title;
    data.description = fields.description;
    data.dueDate = fields.dueDate;
    data.project = {
      connectOrCreate: {
        where: { userId_name: { userId: user.id, name: fields.project } },
        create: { name: fields.project, userId: user.id },
      },
    };
  }

  if (Object.keys(data).length === 0) {
    return badRequest("No valid fields to update");
  }

  const task = await prisma.task.update({
    where: { id },
    data,
    include: { project: true },
  });

  return NextResponse.json(serializeTask(task));
}

export async function DELETE(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const { count } = await prisma.task.deleteMany({ where: { id, userId: user.id } });
  if (count === 0) return notFound();

  return new NextResponse(null, { status: 204 });
}
