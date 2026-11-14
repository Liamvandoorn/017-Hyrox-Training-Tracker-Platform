"use client";

import { TrainingSession } from "@/lib/types";

interface SessionListProps {
  sessions: TrainingSession[];
  onDelete: (id: number) => void;
  isLoading: boolean;
}

export default function SessionList({
  sessions,
  onDelete,
  isLoading,
}: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No training sessions yet. Add one to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-bold text-offwhite mb-4">Training History</h2>
      {sessions.map((session) => (
        <div
          key={session.id}
          className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-offwhite">
                  {session.exercise}
                </h3>
                <span className="text-sm bg-gray-700 text-offwhite px-2 py-1 rounded">
                  {session.duration} min
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-2">
                {new Date(session.date).toLocaleDateString()}
              </p>
              {session.distance && (
                <p className="text-sm text-gray-400">
                  Distance: <span className="text-offwhite">{session.distance} km</span>
                </p>
              )}
              {session.notes && (
                <p className="text-sm text-gray-300 mt-2 italic">"{session.notes}"</p>
              )}
            </div>
            <button
              onClick={() => onDelete(session.id)}
              disabled={isLoading}
              className="ml-4 bg-red-900 hover:bg-red-800 text-offwhite px-3 py-1 rounded text-sm transition-colors disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
