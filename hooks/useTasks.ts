"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { NewTaskInput, Task } from "@/lib/types";

export function useTasks() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    fetch("/api/tasks").then((res) => {
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      res.json().then((data: Task[]) => {
        setTasks(data);
        setHydrated(true);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addTask(input: NewTaskInput) {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    if (!res.ok) return;
    const task: Task = await res.json();
    setTasks((prev) => [...prev, task]);
  }

  async function updateTask(id: string, input: NewTaskInput) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    if (!res.ok) return;
    const updated: Task = await res.json();
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }

  function toggleComplete(id: string) {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    const completed = !target.completed;

    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed } : t)));

    fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    }).catch(() => {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: target.completed } : t))
      );
    });
  }

  return { tasks, hydrated, addTask, updateTask, toggleComplete };
}
