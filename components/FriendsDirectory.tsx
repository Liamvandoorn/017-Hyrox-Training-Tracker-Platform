"use client";

import { useCallback, useEffect, useState } from "react";
import FriendProfileCard from "@/components/FriendProfileCard";
import ProfileAvatar from "@/components/ProfileAvatar";

interface User {
  id: number;
  displayName: string;
}

export default function FriendsDirectory({ onClose }: { onClose: () => void }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserName, setSelectedUserName] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/users", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Could not load users");
      }
      const data = await response.json();
      setUsers(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <>
      <button
        type="button"
        aria-label="Close friends"
        onClick={onClose}
        className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
      />
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="friends-title"
          className="max-h-[calc(100dvh-120px)] w-full max-w-sm overflow-y-auto rounded-2xl border border-white/10 bg-[#1c1c1f] p-6 shadow-xl"
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 id="friends-title" className="text-xl font-semibold text-[#f3f2f4]">Friends</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close friends"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#303034] text-[#b8b3ba] hover:bg-[#404045]"
            >
              ×
            </button>
          </div>

          {error && (
            <p role="alert" className="mb-4 text-sm text-[#ffa8a4]">
              {error}
            </p>
          )}

          {loading ? (
            <p className="text-center text-sm text-[#aaa5ad]">Loading friends...</p>
          ) : users.length === 0 ? (
            <p className="text-center text-sm text-[#aaa5ad]">No users found</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              {users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => {
                    setSelectedUserId(user.id);
                    setSelectedUserName(user.displayName);
                  }}
                  className="flex min-w-0 flex-col items-center gap-3 rounded-2xl bg-[#27272b] p-2 transition-colors hover:bg-[#303034]"
                >
                  <ProfileAvatar userId={user.id} displayName={user.displayName} size={80} />
                  <p className="max-w-full text-center text-sm font-medium text-[#d8d4da] line-clamp-2">
                    {user.displayName}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {selectedUserId !== null && (
        <FriendProfileCard
          userId={selectedUserId}
          displayName={selectedUserName}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </>
  );
}
