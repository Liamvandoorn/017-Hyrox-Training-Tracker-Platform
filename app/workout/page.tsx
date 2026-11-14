"use client";

import { useState } from "react";
import AddSessionForm from "@/components/AddSessionForm";
import { TrainingSession } from "@/lib/types";

export default function WorkoutPage() {
  const [recentSessions, setRecentSessions] = useState<TrainingSession[]>([]);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSessionAdded = (newSession: TrainingSession) => {
    setRecentSessions([newSession, ...recentSessions.slice(0, 4)]);
    setSuccessMessage("Workout logged successfully! 🎉");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  return (
    <div className="min-h-screen bg-darkgrey pb-24 md:pb-0">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-offwhite mb-2">Log Workout</h1>
          <p className="text-gray-400">Track your Hyrox training session</p>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {successMessage && (
          <div className="mb-6 bg-green-900/30 border border-green-700 text-green-300 px-6 py-4 rounded-xl">
            {successMessage}
          </div>
        )}

        <AddSessionForm onSessionAdded={handleSessionAdded} isLoading={false} />

        {/* Recent Sessions */}
        {recentSessions.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-offwhite mb-6">
              Recent Sessions
            </h2>
            <div className="space-y-4">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-orange-500 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-orange-500 font-bold text-lg">
                        {session.exercise}
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        {new Date(session.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-offwhite font-semibold">
                        {session.duration}m
                      </p>
                      {session.distance && (
                        <p className="text-gray-400 text-sm">
                          {session.distance} km
                        </p>
                      )}
                    </div>
                  </div>
                  {session.notes && (
                    <p className="text-gray-300 text-sm mt-4 border-t border-gray-700 pt-4">
                      {session.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
