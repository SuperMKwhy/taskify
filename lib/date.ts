export type DueStatus = "overdue" | "today" | "soon" | "normal";

function daysUntil(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + "T00:00:00");
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

export function getDueStatus(dueDate: string, completed: boolean): DueStatus {
  if (completed) return "normal";
  const diffDays = daysUntil(dueDate);
  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "today";
  if (diffDays <= 2) return "soon";
  return "normal";
}

/** Short, human due label: "Today", "Tomorrow", "2d overdue", or "Aug 25". */
export function formatDueDate(dueDate: string, completed = false): string {
  const diffDays = daysUntil(dueDate);
  if (!completed) {
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 0) return `${-diffDays}d overdue`;
  }
  const due = new Date(dueDate + "T00:00:00");
  const sameYear = due.getFullYear() === new Date().getFullYear();
  return due.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

export function todayIso(): string {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10);
}
