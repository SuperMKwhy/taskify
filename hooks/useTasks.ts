"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { NewTaskInput, Task } from "@/lib/types";
import { api, errorMessage } from "@/lib/api";
import { useToast } from "@/components/Toaster";

export type LoadState = "loading" | "ready" | "error";

const UNDO_WINDOW_MS = 5000;

export function useTasks() {
  const toast = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState<LoadState>("loading");
  // Deletes wait out the undo window before hitting the server.
  const pendingDeletes = useRef(new Map<string, Task>());

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      setTasks(await api<Task[]>("/api/tasks"));
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  // Commit any deletes still inside their undo window if the tab closes.
  useEffect(() => {
    function flush() {
      for (const id of pendingDeletes.current.keys()) {
        fetch(`/api/tasks/${id}`, { method: "DELETE", keepalive: true });
      }
      pendingDeletes.current.clear();
    }
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, []);

  async function addTask(input: NewTaskInput) {
    const task = await api<Task>("/api/tasks", { method: "POST", body: JSON.stringify(input) });
    setTasks((prev) => [...prev, task]);
  }

  async function updateTask(id: string, input: NewTaskInput) {
    const updated = await api<Task>(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }

  function toggleComplete(id: string) {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    const completed = !target.completed;

    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed } : t)));

    api(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify({ completed }) }).catch((err) => {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: target.completed } : t)));
      toast.show(errorMessage(err), { tone: "error" });
    });
  }

  function deleteTask(id: string) {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;

    pendingDeletes.current.set(id, target);
    setTasks((prev) => prev.filter((t) => t.id !== id));

    const restore = () => {
      pendingDeletes.current.delete(id);
      setTasks((prev) =>
        prev.some((t) => t.id === id)
          ? prev
          : [...prev, target].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      );
    };

    toast.show(`Deleted “${truncate(target.title, 40)}”`, {
      duration: UNDO_WINDOW_MS,
      action: { label: "Undo", onClick: restore },
      onExpire: () => {
        if (!pendingDeletes.current.has(id)) return;
        pendingDeletes.current.delete(id);
        api(`/api/tasks/${id}`, { method: "DELETE" }).catch((err) => {
          restore();
          toast.show(`Couldn't delete the task. ${errorMessage(err)}`, { tone: "error" });
        });
      },
    });
  }

  return { tasks, status, reload: load, addTask, updateTask, toggleComplete, deleteTask };
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
