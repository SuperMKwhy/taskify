import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeTask } from "@/lib/serializeTask";
import { getCurrentUser } from "@/lib/auth";
import { badRequest, parseTaskFields, readJsonObject, unauthorized } from "@/lib/validation";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const tasks = await prisma.task.findMany({
    where: { userId: user.id },
    include: { project: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(tasks.map(serializeTask));
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await readJsonObject(request);
  if (!body) return badRequest("Invalid request body");

  const fields = parseTaskFields(body);
  if (typeof fields === "string") return badRequest(fields);

  const task = await prisma.task.create({
    data: {
      title: fields.title,
      description: fields.description,
      dueDate: fields.dueDate,
      user: { connect: { id: user.id } },
      project: {
        connectOrCreate: {
          where: { userId_name: { userId: user.id, name: fields.project } },
          create: { name: fields.project, userId: user.id },
        },
      },
    },
    include: { project: true },
  });

  return NextResponse.json(serializeTask(task), { status: 201 });
}
