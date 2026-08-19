"use client";

import { useState } from "react";
import { Canvas } from "@/components/Canvas";
import { AddTaskButton } from "@/components/AddTaskButton";
import { TaskFormModal } from "@/components/TaskFormModal";
import { AccountMenu } from "@/components/AccountMenu";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";

export default function Home() {
  const { tasks, addTask, toggleComplete } = useTasks();
  const { projects, addProject } = useProjects();
  const [formOpen, setFormOpen] = useState(false);

  return (
    <>
      <Canvas tasks={tasks} onToggleComplete={toggleComplete} />
      <AccountMenu />
      <AddTaskButton onClick={() => setFormOpen(true)} />
      <TaskFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={addTask}
        projects={projects}
        onAddProject={addProject}
      />
    </>
  );
}
