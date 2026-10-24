"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { Alert, Button, Field, PasswordInput, TextInput } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,24}$/;

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ username: false, password: false });
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const usernameError =
    touched.username && username && !USERNAME_RE.test(username)
      ? "3–24 characters: letters, numbers, _ or -"
      : null;
  const passwordError =
    touched.password && password && password.length < 8 ? "Use at least 8 characters" : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ username: true, password: true });
    if (!USERNAME_RE.test(username) || password.length < 8) return;

    setError(null);
    setSubmitting(true);
    try {
      await api("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ username, email, password }),
      });
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="Create your board" subtitle="Free, and it takes about ten seconds.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert>{error}</Alert>}

        <Field label="Username" hint="3–24 characters: letters, numbers, _ or -" error={usernameError}>
          {({ id, describedBy, invalid }) => (
            <TextInput
              id={id}
              required
              autoFocus
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={24}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, username: true }))}
              aria-describedby={describedBy}
              aria-invalid={invalid}
            />
          )}
        </Field>

        <Field label="Email">
          {({ id }) => (
            <TextInput
              id={id}
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
        </Field>

        <Field label="Password" hint="At least 8 characters" error={passwordError}>
          {({ id, describedBy, invalid }) => (
            <PasswordInput
              id={id}
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              aria-describedby={describedBy}
              aria-invalid={invalid}
            />
          )}
        </Field>

        <Button type="submit" variant="primary" loading={submitting} className="mt-2 h-11 w-full">
          {submitting ? "Creating account…" : "Create account"}
        </Button>

        <p className="text-center text-sm text-fg-subtle">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-fg underline decoration-white/30 underline-offset-4 hover:decoration-accent">
            Log in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
