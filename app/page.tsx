"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@/components/Canvas";
import { AddTaskButton } from "@/components/AddTaskButton";
import { TaskFormModal } from "@/components/TaskFormModal";
import { AccountMenu } from "@/components/AccountMenu";
import { BoardHeader, EmptyState, ErrorState, GestureHint, LoadingState } from "@/components/BoardChrome";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";

export default function Home() {
  const { tasks, status, reload, addTask, updateTask, toggleComplete, deleteTask } = useTasks();
  const { projects, rememberProject } = useProjects();
  const [formOpen, setFormOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const editingTask = tasks.find((t) => t.id === editingTaskId) ?? null;

  function openNew() {
    setEditingTaskId(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
  }

  // "N" opens a new task from anywhere on the board.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (formOpen || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        openNew();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [formOpen]);

  return (
    <main>
      <h1 className="sr-only">Taskify board</h1>
      <Canvas
        tasks={tasks}
        ready={status !== "loading"}
        onToggleComplete={toggleComplete}
        onEditTask={(id) => {
          setEditingTaskId(id);
          setFormOpen(true);
        }}
        onDeleteTask={deleteTask}
      />

      <BoardHeader tasks={tasks} loading={status === "loading"} />
      <div className="fixed right-4 top-4 z-40 sm:right-6 sm:top-6">
        <AccountMenu />
      </div>
      <GestureHint show={status === "ready" && tasks.length > 0} />
      <AddTaskButton onClick={openNew} />

      {status === "loading" && <LoadingState />}
      {status === "error" && <ErrorState onRetry={reload} />}
      {status === "ready" && tasks.length === 0 && !formOpen && <EmptyState onAdd={openNew} />}

      <TaskFormModal
        open={formOpen}
        onClose={closeForm}
        onSubmit={async (input) => {
          if (editingTask) {
            await updateTask(editingTask.id, input);
          } else {
            await addTask(input);
          }
          rememberProject(input.project);
        }}
        onDelete={
          editingTask
            ? () => {
                deleteTask(editingTask.id);
                closeForm();
              }
            : undefined
        }
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
      />
    </main>
  );
}
