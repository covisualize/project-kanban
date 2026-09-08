"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  createProject,
  deleteProject,
  updateProject,
} from "@/lib/api-client";
import type { Project } from "@/lib/types";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  errorClass,
  fieldClass,
  labelClass,
} from "@/lib/ui";

type ProjectListProps = {
  projects: Project[];
};

/** List, create, rename, and delete projects via the SQLite CRUD APIs. */
export function ProjectList({ projects }: ProjectListProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const project = await createProject(name);
      setName("");
      router.push(`/projects/${project.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create project");
    } finally {
      setPending(false);
    }
  }

  async function onRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) return;
    setError(null);
    setPending(true);
    try {
      await updateProject(editingId, editName);
      setEditingId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not rename project");
    } finally {
      setPending(false);
    }
  }

  async function onDelete(project: Project) {
    const ok = window.confirm(
      `Delete project “${project.name}” and all of its cards?`,
    );
    if (!ok) return;
    setError(null);
    setPending(true);
    try {
      await deleteProject(project.id);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete project");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <form
        onSubmit={onCreate}
        className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          New project
        </h2>
        <label className={`${labelClass} mt-3`} htmlFor="project-name">
          Name
        </label>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row">
          <input
            id="project-name"
            name="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={fieldClass}
            placeholder="Sprint board"
            disabled={pending}
          />
          <button type="submit" className={btnPrimary} disabled={pending}>
            Create project
          </button>
        </div>
      </form>

      {error ? <p className={errorClass}>{error}</p> : null}

      {projects.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No projects yet. Create one above, or run{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-800">
            npm run seed
          </code>{" "}
          for demo data.
        </p>
      ) : (
        <ul className="space-y-3">
          {projects.map((project) => (
            <li
              key={project.id}
              className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              {editingId === project.id ? (
                <form onSubmit={onRename} className="space-y-3">
                  <label className={labelClass} htmlFor={`rename-${project.id}`}>
                    Rename project
                  </label>
                  <input
                    id={`rename-${project.id}`}
                    required
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    className={fieldClass}
                    disabled={pending}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button type="submit" className={btnPrimary} disabled={pending}>
                      Save
                    </button>
                    <button
                      type="button"
                      className={btnSecondary}
                      onClick={() => setEditingId(null)}
                      disabled={pending}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Link
                      href={`/projects/${project.id}`}
                      className="text-base font-medium text-zinc-950 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 dark:text-zinc-50"
                    >
                      {project.name}
                    </Link>
                    <p className="mt-1 text-xs text-zinc-500">
                      Open the board to manage cards
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/projects/${project.id}`}
                      className={btnPrimary}
                    >
                      Open
                    </Link>
                    <button
                      type="button"
                      className={btnSecondary}
                      disabled={pending}
                      onClick={() => {
                        setEditingId(project.id);
                        setEditName(project.name);
                        setError(null);
                      }}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      className={btnDanger}
                      disabled={pending}
                      onClick={() => onDelete(project)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
