"use client";

import { useCallback, useEffect, useState } from "react";

interface ManagedUser {
  id: number;
  displayName: string;
  role: "admin" | "user";
  active: boolean;
  createdAt: string;
}

function getErrorMessage(payload: unknown, fallback: string): string {
  return typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
    ? payload.error
    : fallback;
}

export default function AdminUserManager() {
  const [users, setUsers] = useState<ManagedUser[] | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const payload: unknown = await response.json();
      if (!response.ok || !Array.isArray(payload)) {
        throw new Error(getErrorMessage(payload, "Could not load accounts."));
      }
      setUsers(payload as ManagedUser[]);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load accounts.");
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const createAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, pin }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        throw new Error(getErrorMessage(payload, "Could not create account."));
      }
      setDisplayName("");
      setPin("");
      setNotice("Account created. Give the user their PIN securely.");
      await loadUsers();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not create account.");
    } finally {
      setIsSaving(false);
    }
  };

  const deactivateAccount = async (user: ManagedUser) => {
    setError("");
    setNotice("");
    if (!window.confirm(`Deactivate ${user.displayName}'s account? They won't be able to sign in.`)) {
      return;
    }
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, active: false }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        throw new Error(getErrorMessage(payload, "Could not deactivate account."));
      }
      setNotice(`${user.displayName}'s account was deactivated.`);
      await loadUsers();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not deactivate account.");
    }
  };

  const reactivateAccount = async (user: ManagedUser) => {
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, active: true }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        throw new Error(getErrorMessage(payload, "Could not reactivate account."));
      }
      setNotice(`${user.displayName}'s account was reactivated.`);
      await loadUsers();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not reactivate account.");
    }
  };

  return (
    <section className="mb-5 rounded-[1.7rem] border border-white/10 bg-[#1c1c1f] p-5 shadow-sm sm:p-7">
      <h2 className="text-lg font-semibold text-[#f3f2f4]">Manage accounts</h2>
      <p className="mb-6 mt-2 text-sm leading-relaxed text-[#aaa5ad]">
        Create accounts for people who will sign in using a unique 4-digit PIN.
        PINs are the account identifier, so no two users can share one.
      </p>

      <form onSubmit={createAccount} className="mb-6 grid gap-3 sm:grid-cols-[1fr_150px_auto]">
        <label className="text-xs font-medium text-[#d8d4da]">
          Account name
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            required
            minLength={2}
            maxLength={60}
            autoComplete="off"
            className="mt-1 w-full rounded-xl border border-white/10 bg-[#27272b] px-3 py-3 text-sm text-[#f3f2f4] outline-none focus:border-[#ef7890]"
          />
        </label>
        <label className="text-xs font-medium text-[#d8d4da]">
          4-digit PIN
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]{4}"
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
            required
            minLength={4}
            maxLength={4}
            autoComplete="new-password"
            className="mt-1 w-full rounded-xl border border-white/10 bg-[#27272b] px-3 py-3 text-center text-sm tracking-[0.3em] text-[#f3f2f4] outline-none focus:border-[#ef7890]"
          />
        </label>
        <button
          type="submit"
          disabled={isSaving}
          className="self-end rounded-xl bg-[#f16b84] px-4 py-3 text-sm font-bold text-[#290f18] hover:bg-[#ff91a5] disabled:opacity-60"
        >
          {isSaving ? "Creating..." : "Create account"}
        </button>
      </form>

      {error && <p role="alert" className="mb-4 text-sm text-[#ffa8a4]">{error}</p>}
      {notice && <p role="status" className="mb-4 text-sm text-[#a6e6c1]">{notice}</p>}
      {users === null ? (
        <p role="status" className="text-sm text-[#aaa5ad]">Loading accounts...</p>
      ) : (
        <ul className="divide-y divide-white/10">
          {users.map((user) => (
            <li key={user.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-medium text-[#f3f2f4]">{user.displayName}</p>
                <p className="mt-1 text-xs capitalize text-[#8f8992]">
                  {user.role} · {user.active ? "Active" : "Deactivated"}
                </p>
              </div>
              <div className="flex gap-2">
                {user.role === "user" && user.active && (
                  <button
                    type="button"
                    onClick={() => void deactivateAccount(user)}
                    className="rounded-lg bg-red-900/40 px-4 py-2 text-xs font-semibold text-red-300 hover:bg-red-900/60 border border-red-800"
                  >
                    Deactivate
                  </button>
                )}
                {user.role === "user" && !user.active && (
                  <button
                    type="button"
                    onClick={() => void reactivateAccount(user)}
                    className="rounded-lg bg-green-900/40 px-4 py-2 text-xs font-semibold text-green-300 hover:bg-green-900/60 border border-green-800"
                  >
                    Reactivate
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
