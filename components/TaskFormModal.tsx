"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { NewTaskInput } from "@/lib/types";
import { getProjectHue } from "@/lib/hash";
import { todayIso } from "@/lib/date";
import { errorMessage } from "@/lib/api";
import { Alert, Button, Field, INPUT_CLASS, Kbd } from "./ui";

const LIMITS = { project: 60, title: 200, description: 2000 };

function addDaysIso(days: number) {
  const d = new Date(todayIso() + "T00:00:00");
  d.setDate(d.getDate() + days);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

const QUICK_DATES = [
  { label: "Today", days: 0 },
  { label: "Tomorrow", days: 1 },
  { label: "In a week", days: 7 },
];

export function TaskFormModal({
  open,
  onClose,
  onSubmit,
  onDelete,
  projects,
  initialValues,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: NewTaskInput) => Promise<void>;
  /** Present only when editing an existing task. */
  onDelete?: () => void;
  projects: string[];
  initialValues?: NewTaskInput;
}) {
  const isEditing = Boolean(initialValues);
  const titleId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const [project, setProject] = useState("");
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProject, setNewProject] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(todayIso());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMac(/Mac|iPhone|iPad/.test(navigator.userAgent));
  }, []);

  // Prefill when opening to edit, reset when opening fresh. With no projects
  // yet, go straight to naming one.
  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    /* eslint-disable react-hooks/set-state-in-effect */
    setError(null);
    setProjectError(null);
    setSubmitting(false);
    setNewProject("");
    if (initialValues) {
      setProject(initialValues.project);
      setIsAddingProject(false);
      setTitle(initialValues.title);
      setDescription(initialValues.description ?? "");
      setDueDate(initialValues.dueDate);
    } else {
      setProject(projects.length === 1 ? projects[0] : "");
      setIsAddingProject(projects.length === 0);
      setTitle("");
      setDescription("");
      setDueDate(todayIso());
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open) return;
    returnFocusRef.current?.focus?.();
  }, [open]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
    } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    } else if (e.key === "Tab") {
      // Keep focus inside the dialog.
      const focusables = formRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    const finalProject = (isAddingProject ? newProject : project).trim();
    if (!finalProject) {
      setProjectError(isAddingProject ? "Name the new project" : "Pick a project for this task");
      return;
    }
    if (!title.trim()) {
      titleInputRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ project: finalProject, title: title.trim(), description: description.trim(), dueDate });
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  }

  const descriptionNearLimit = description.length > LIMITS.description * 0.8;

  return (
    <AnimatePresence>
      {open && (
        // The container itself never animates opacity: a translucent ancestor
        // would cut the dialog's backdrop blur off from the board.
        <div
          key="task-form"
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-[oklch(0.1_0.03_275/0.4)] backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onPointerDown={onClose}
          />
          <motion.form
            ref={formRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onSubmit={handleSubmit}
            onKeyDown={handleKeyDown}
            noValidate
            data-no-canvas-wheel
            className="glass-strong relative flex max-h-[92dvh] w-full max-w-md flex-col overflow-y-auto rounded-t-[28px] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-[28px] sm:p-6"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 id={titleId} className="text-lg font-semibold tracking-[-0.01em] text-fg">
                {isEditing ? "Edit task" : "New task"}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-mr-1.5 flex h-8 w-8 items-center justify-center rounded-full text-fg-subtle transition-colors hover:bg-white/10 hover:text-fg"
              >
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden>
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {error && <Alert>{error}</Alert>}

              <Field label="Task">
                {({ id }) => (
                  <input
                    ref={titleInputRef}
                    id={id}
                    required
                    autoFocus={!isAddingProject || isEditing}
                    value={title}
                    maxLength={LIMITS.title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    className={INPUT_CLASS}
                  />
                )}
              </Field>

              <fieldset>
                <legend className="mb-1.5 text-[13px] font-medium text-fg-muted">Project</legend>
                <div role="radiogroup" aria-label="Project" className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto p-0.5">
                  {projects.map((p) => {
                    const hue = getProjectHue(p);
                    const selected = !isAddingProject && project === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => {
                          setProject(p);
                          setIsAddingProject(false);
                          setProjectError(null);
                        }}
                        className={`inline-flex h-8 max-w-full items-center gap-1.5 rounded-full px-3 text-[13px] font-medium ring-1 transition-colors ${
                          selected ? "text-fg" : "text-fg-muted ring-white/12 hover:bg-white/8 hover:text-fg"
                        }`}
                        style={
                          selected
                            ? {
                                background: `oklch(0.7 0.12 ${hue} / 0.24)`,
                                ["--tw-ring-color" as string]: `oklch(0.8 0.13 ${hue} / 0.6)`,
                              }
                            : undefined
                        }
                      >
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: `oklch(0.8 0.15 ${hue})` }} />
                        <span className="truncate">{p}</span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isAddingProject}
                    onClick={() => {
                      setIsAddingProject(true);
                      setProjectError(null);
                    }}
                    className={`inline-flex h-8 items-center gap-1 rounded-full border border-dashed px-3 text-[13px] font-medium transition-colors ${
                      isAddingProject
                        ? "border-accent/60 bg-accent/10 text-fg"
                        : "border-white/20 text-fg-muted hover:border-white/35 hover:text-fg"
                    }`}
                  >
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
                      <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                    New project
                  </button>
                </div>
                {isAddingProject && (
                  <input
                    autoFocus={!isEditing}
                    value={newProject}
                    maxLength={LIMITS.project}
                    onChange={(e) => {
                      setNewProject(e.target.value);
                      setProjectError(null);
                    }}
                    placeholder="Project name, e.g. Home, Work, Thesis"
                    aria-label="New project name"
                    aria-invalid={Boolean(projectError)}
                    className={`${INPUT_CLASS} mt-2`}
                  />
                )}
                {projectError && <p className="mt-1.5 text-xs text-danger">{projectError}</p>}
              </fieldset>

              <Field label="Due date">
                {({ id }) => (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      id={id}
                      type="date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className={`${INPUT_CLASS} sm:w-44 sm:shrink-0`}
                    />
                    <div className="flex gap-1.5">
                      {QUICK_DATES.map((q) => {
                        const value = addDaysIso(q.days);
                        const active = dueDate === value;
                        return (
                          <button
                            key={q.label}
                            type="button"
                            onClick={() => setDueDate(value)}
                            aria-pressed={active}
                            className={`h-8 whitespace-nowrap rounded-full px-2.5 text-xs font-medium transition-colors ${
                              active ? "bg-white/15 text-fg" : "text-fg-subtle hover:bg-white/8 hover:text-fg"
                            }`}
                          >
                            {q.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Field>

              <Field
                label="Notes"
                optional
                hint={descriptionNearLimit ? `${description.length} / ${LIMITS.description}` : undefined}
              >
                {({ id, describedBy }) => (
                  <textarea
                    id={id}
                    value={description}
                    maxLength={LIMITS.description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Links, details, anything you'll want later"
                    aria-describedby={describedBy}
                    className="glass-field block w-full resize-none rounded-xl px-3.5 py-2.5 text-[15px] leading-relaxed text-fg"
                  />
                )}
              </Field>
            </div>

            <div className="mt-6 flex items-center gap-2">
              {onDelete && (
                <Button type="button" variant="danger" onClick={onDelete} className="-ml-2 px-3">
                  Delete
                </Button>
              )}
              <span className="ml-auto hidden items-center gap-1 text-xs text-fg-subtle sm:flex">
                <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
                <Kbd>↵</Kbd>
              </span>
              <Button type="button" variant="ghost" onClick={onClose} className="ml-auto sm:ml-1">
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                {isEditing ? "Save changes" : "Add task"}
              </Button>
            </div>
          </motion.form>
        </div>
      )}
    </AnimatePresence>
  );
}
