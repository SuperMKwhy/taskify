"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GridBackdrop } from "@/components/GridBackdrop";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });

    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <GridBackdrop className="flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-800 p-6 shadow-2xl"
      >
        <h1 className="mb-4 text-lg font-semibold text-zinc-100">Log in</h1>

        {error && (
          <p className="mb-3 rounded-lg bg-rose-400/10 px-3 py-2 text-sm text-rose-300">
            {error}
          </p>
        )}

        <label className="mb-3 block text-xs font-medium text-zinc-400">
          Username or email
          <input
            required
            autoFocus
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-400"
          />
        </label>

        <label className="mb-5 block text-xs font-medium text-zinc-400">
          Password
          <input
            required
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-400"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-50"
        >
          {submitting ? "Logging in…" : "Log in"}
        </button>

        <p className="mt-4 text-center text-xs text-zinc-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-zinc-300 hover:text-white">
            Sign up
          </Link>
        </p>
      </form>
    </GridBackdrop>
  );
}
