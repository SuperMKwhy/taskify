"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useProjects() {
  const router = useRouter();
  const [projects, setProjects] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/projects").then((res) => {
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      res.json().then((data: { projects: string[] }) => setProjects(data.projects));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addProject(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    if (!res.ok) return;
    const project: { name: string } = await res.json();

    setProjects((prev) => (prev.includes(project.name) ? prev : [...prev, project.name]));
  }

  return { projects, addProject };
}
