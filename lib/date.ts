export type DueStatus = "overdue" | "soon" | "normal";

export function getDueStatus(dueDate: string, completed: boolean): DueStatus {
  if (completed) return "normal";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + "T00:00:00");
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  if (diffDays < 0) return "overdue";
  if (diffDays <= 2) return "soon";
  return "normal";
}

export function formatDueDate(dueDate: string): string {
  const due = new Date(dueDate + "T00:00:00");
  return due.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
