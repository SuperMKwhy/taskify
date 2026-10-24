"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function useProjects() {
  const [projects, setProjects] = useState<string[]>([]);

  useEffect(() => {
    api<{ projects: string[] }>("/api/projects")
      .then((data) => setProjects(data.projects))
      // The task form still works without the list - it falls back to
      // naming a new project inline.
      .catch(() => {});
  }, []);

  /** Saving a task creates its project server-side; this mirrors it locally. */
  function rememberProject(name: string) {
    setProjects((prev) => (prev.includes(name) ? prev : [...prev, name]));
  }

  return { projects, rememberProject };
}
