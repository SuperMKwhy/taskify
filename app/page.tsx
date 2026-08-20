"use client";

import { useState } from "react";
import { Canvas } from "@/components/Canvas";
import { AddTaskButton } from "@/components/AddTaskButton";
import { TaskFormModal } from "@/components/TaskFormModal";
import { AccountMenu } from "@/components/AccountMenu";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";

export default function Home() {
  const { tasks, addTask, updateTask, toggleComplete } = useTasks();
  const { projects, addProject } = useProjects();
  const [formOpen, setFormOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const editingTask = tasks.find((t) => t.id === editingTaskId) ?? null;

  function closeForm() {
    setFormOpen(false);
    setEditingTaskId(null);
  }

  return (
    <>
      <Canvas
        tasks={tasks}
        onToggleComplete={toggleComplete}
        onEditTask={(id) => {
          setEditingTaskId(id);
          setFormOpen(true);
        }}
      />
      <AccountMenu />
      <AddTaskButton onClick={() => setFormOpen(true)} />
      <TaskFormModal
        open={formOpen}
        onClose={closeForm}
        onSubmit={async (input) => {
          if (editingTask) {
            await updateTask(editingTask.id, input);
          } else {
            await addTask(input);
          }
        }}
        initialValues={
          editingTask
            ? {
                project: editingTask.project,
                title: editingTask.title,
                description: editingTask.description ?? "",
                dueDate: editingTask.dueDate,
              }
            : undefined
        }
        projects={projects}
        onAddProject={addProject}
      />
    </>
  );
}
