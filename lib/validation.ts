import { NextResponse } from "next/server";

export const LIMITS = {
  project: 60,
  title: 200,
  description: 2000,
} as const;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/** Parses a JSON object body, or returns null for malformed/non-object input. */
export async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === "object" && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}

export function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isValidIsoDate(value: string) {
  if (!ISO_DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export type TaskFields = {
  project: string;
  title: string;
  description: string | null;
  dueDate: Date;
};

/** Validates the editable task fields. Returns an error message on failure. */
export function parseTaskFields(body: Record<string, unknown>): TaskFields | string {
  const project = str(body.project);
  const title = str(body.title);
  const description = str(body.description);
  const dueDate = str(body.dueDate);

  if (!project) return "Choose or create a project";
  if (!title) return "Give the task a title";
  if (!dueDate || !isValidIsoDate(dueDate)) return "Pick a valid due date";
  if (project.length > LIMITS.project) return `Project names are limited to ${LIMITS.project} characters`;
  if (title.length > LIMITS.title) return `Titles are limited to ${LIMITS.title} characters`;
  if (description.length > LIMITS.description) {
    return `Descriptions are limited to ${LIMITS.description} characters`;
  }

  return {
    project,
    title,
    description: description || null,
    dueDate: new Date(`${dueDate}T00:00:00.000Z`),
  };
}
