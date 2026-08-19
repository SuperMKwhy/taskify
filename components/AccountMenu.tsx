"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function AccountMenu() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { username: string } | null) => setUsername(data?.username ?? null));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (!username) return null;

  return (
    <div className="fixed right-6 top-6 z-40 flex items-center gap-2 rounded-full border border-white/10 bg-zinc-800/80 py-1.5 pl-3 pr-1.5 text-sm text-zinc-300 shadow-lg shadow-black/30 backdrop-blur-md">
      <span className="text-zinc-400">{username}</span>
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-zinc-200 hover:bg-white/10"
      >
        Log out
      </button>
    </div>
  );
}
