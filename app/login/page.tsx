"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { Alert, Button, Field, PasswordInput, TextInput } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      });
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to pick up where you left off.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert>{error}</Alert>}

        <Field label="Username or email">
          {({ id }) => (
            <TextInput
              id={id}
              required
              autoFocus
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          )}
        </Field>

        <Field label="Password">
          {({ id }) => (
            <PasswordInput
              id={id}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
        </Field>

        <Button type="submit" variant="primary" loading={submitting} className="mt-2 h-11 w-full">
          {submitting ? "Logging in…" : "Log in"}
        </Button>

        <p className="text-center text-sm text-fg-subtle">
          New to Taskify?{" "}
          <Link href="/signup" className="font-medium text-fg underline decoration-white/30 underline-offset-4 hover:decoration-accent">
            Create an account
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
