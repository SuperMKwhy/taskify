import type { Task as PrismaTask, Project } from "@prisma/client";
import type { Task } from "./types";

export function serializeTask(task: PrismaTask & { project: Project }): Task {
  return {
    id: task.id,
    project: task.project.name,
    title: task.title,
    description: task.description ?? undefined,
    dueDate: task.dueDate.toISOString().slice(0, 10),
    completed: task.completed,
    createdAt: task.createdAt.toISOString(),
  };
}
