"use client";

import { useEffect, useState } from "react";
import PasscodeScreen from "@/components/PasscodeScreen";
import AddSessionForm from "@/components/AddSessionForm";
import SessionList from "@/components/SessionList";
import { TrainingSession } from "@/lib/types";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already authenticated
    const isAuth = localStorage.getItem("hyrox_authenticated") === "true";
    if (isAuth) {
      setIsAuthenticated(true);
      loadSessions();
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/training");
      if (!response.ok) {
        throw new Error("Failed to load training sessions");
      }
      const data = await response.json();
      setSessions(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlock = () => {
    setIsAuthenticated(true);
    loadSessions();
  };

  const handleSessionAdded = (newSession: TrainingSession) => {
    setSessions([newSession, ...sessions]);
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/training?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete session");
      }
      setSessions(sessions.filter((s) => s.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete session"
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("hyrox_authenticated");
    setIsAuthenticated(false);
    setSessions([]);
  };

  if (!isAuthenticated) {
    return <PasscodeScreen onUnlock={handleUnlock} />;
  }

  return (
    <main className="min-h-screen bg-darkgrey">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-offwhite">
            Hyrox Training Tracker
          </h1>
          <button
            onClick={handleLogout}
            className="bg-red-900 hover:bg-red-800 text-offwhite px-4 py-2 rounded text-sm transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : (
          <>
            <AddSessionForm onSessionAdded={handleSessionAdded} isLoading={isLoading} />
            <SessionList
              sessions={sessions}
              onDelete={handleDelete}
              isLoading={isLoading}
            />
          </>
        )}
      </div>
    </main>
  );
}
