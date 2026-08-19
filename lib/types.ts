export interface Task {
  id: string;
  project: string;
  title: string;
  description?: string;
  dueDate: string; // ISO date string, e.g. "2026-08-25"
  completed: boolean;
  createdAt: string; // ISO timestamp
}

export type NewTaskInput = {
  project: string;
  title: string;
  description?: string;
  dueDate: string;
};
