"use client";

import { useCallback, useEffect, useState } from "react";
import FriendProfileCard from "@/components/FriendProfileCard";
import ProfileAvatar from "@/components/ProfileAvatar";

interface User {
  id: number;
  displayName: string;
}

export default function FriendsDirectory() {
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

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => {}} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1c1c1f] p-6 shadow-xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[#f3f2f4]">Friends</h2>
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
            <div className="grid grid-cols-3 gap-4">
              {users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => {
                    setSelectedUserId(user.id);
                    setSelectedUserName(user.displayName);
                  }}
                  className="flex flex-col items-center gap-2 rounded-lg p-2 transition-colors hover:bg-[#27272b]"
                >
                  <div className="relative">
                    <ProfileAvatar displayName={user.displayName} size={80} />
                  </div>
                  <p className="text-center text-xs font-medium text-[#d8d4da] line-clamp-2">
                    {user.displayName}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
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
