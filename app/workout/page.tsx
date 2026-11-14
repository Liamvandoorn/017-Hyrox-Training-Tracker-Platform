"use client";

import { useState } from "react";
import AddSessionForm from "@/components/AddSessionForm";
import Navbar from "@/components/Navbar";
import { TrainingSession } from "@/lib/types";

export default function WorkoutPage() {
  const [recentSessions, setRecentSessions] = useState<TrainingSession[]>([]);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSessionAdded = (newSession: TrainingSession) => {
    setRecentSessions([newSession, ...recentSessions.slice(0, 4)]);
    setSuccessMessage("Workout logged successfully.");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  return (
    <div className="min-h-screen bg-transparent pb-28 pt-5">
      <header className="mx-auto max-w-2xl px-4 pb-2">
        <div className="py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#66839a]">HYROX · TRAINING LOG</p>
          <h1 className="mt-1 text-[25px] font-semibold tracking-[-0.04em] text-[#202d37]">Log workout</h1>
          <p className="mt-1 text-sm text-slate-500">Record a session and keep your progress moving.</p>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {successMessage && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
            {successMessage}
          </div>
        )}

        <AddSessionForm onSessionAdded={handleSessionAdded} isLoading={false} />

        {/* Recent Sessions */}
        {recentSessions.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-5 text-lg font-semibold text-slate-800">Recent sessions</h2>
            <div className="space-y-4">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-2xl border border-white/80 bg-white/80 p-5 shadow-sm transition hover:border-[#9bb4c7]"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-lg font-semibold text-[#527b9f]">
                        {session.exercise}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        {new Date(session.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-800">
                        {session.duration}m
                      </p>
                      {session.distance && (
                        <p className="text-sm text-slate-400">
                          {session.distance} km
                        </p>
                      )}
                    </div>
                  </div>
                  {session.notes && (
                    <p className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-600">
                      {session.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Navbar />
    </div>
  );
}
