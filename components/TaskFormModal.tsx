"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { NewTaskInput } from "@/lib/types";

const ADD_NEW_VALUE = "__add_new__";

function todayIso() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function TaskFormModal({
  open,
  onClose,
  onSubmit,
  projects,
  onAddProject,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: NewTaskInput) => void | Promise<void>;
  projects: string[];
  onAddProject: (name: string) => void | Promise<void>;
}) {
  const [project, setProject] = useState("");
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProject, setNewProject] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(todayIso());

  // No projects exist yet, so go straight to creating one instead of
  // showing a dropdown with nothing but "+ Add new project" in it.
  useEffect(() => {
    if (open && projects.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAddingProject(true);
    }
  }, [open, projects.length]);

  function reset() {
    setProject("");
    setIsAddingProject(false);
    setNewProject("");
    setTitle("");
    setDescription("");
    setDueDate(todayIso());
  }

  async function confirmNewProject() {
    const trimmed = newProject.trim();
    if (!trimmed) return;
    await onAddProject(trimmed);
    setProject(trimmed);
    setIsAddingProject(false);
    setNewProject("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    let finalProject = project;
    if (isAddingProject) {
      const trimmed = newProject.trim();
      if (!trimmed) return;
      await onAddProject(trimmed);
      finalProject = trimmed;
    }
    if (!finalProject) return;

    await onSubmit({ project: finalProject, title, description, dueDate });
    reset();
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-800 p-6 shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            <h2 className="mb-4 text-lg font-semibold text-zinc-100">New task</h2>

            <div className="mb-3">
              <label className="block text-xs font-medium text-zinc-400">
                Project
                {!isAddingProject && (
                  <select
                    required
                    value={project}
                    onChange={(e) => {
                      if (e.target.value === ADD_NEW_VALUE) {
                        setIsAddingProject(true);
                      } else {
                        setProject(e.target.value);
                      }
                    }}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-400"
                  >
                    <option value="" disabled>
                      Select a project
                    </option>
                    {projects.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                    <option value={ADD_NEW_VALUE}>+ Add new project</option>
                  </select>
                )}
              </label>

              {isAddingProject && (
                <div className="mt-1 flex gap-2">
                  <input
                    autoFocus
                    value={newProject}
                    onChange={(e) => setNewProject(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        confirmNewProject();
                      }
                    }}
                    placeholder="New project name"
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-400"
                  />
                  <button
                    type="button"
                    onClick={confirmNewProject}
                    className="shrink-0 rounded-lg bg-zinc-700 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-600"
                  >
                    Add
                  </button>
                  {projects.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingProject(false);
                        setNewProject("");
                      }}
                      className="shrink-0 rounded-lg px-2 py-2 text-sm text-zinc-400 hover:text-zinc-200"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>

            <label className="mb-3 block text-xs font-medium text-zinc-400">
              Task
              <input
                required
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-400"
              />
            </label>

            <label className="mb-3 block text-xs font-medium text-zinc-400">
              Description <span className="text-zinc-600">(optional)</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Any extra detail"
                className="mt-1 w-full resize-none rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-400"
              />
            </label>

            <label className="mb-5 block text-xs font-medium text-zinc-400">
              Due date
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-400 [color-scheme:dark]"
              />
            </label>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
              >
                Add task
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
