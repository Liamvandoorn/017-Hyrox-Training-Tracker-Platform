"use client";

import { useEffect } from "react";
import type { WorkoutRecord } from "@/lib/types";

interface DayWorkoutPreviewProps {
  date: Date;
  workouts: WorkoutRecord[] | null;
  error: string | null;
  onClose: () => void;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`
    : `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function workoutTime(workout: WorkoutRecord): number {
  return workout.sets.reduce(
    (total, set) => total + (set.completed ? set.timeSeconds : 0),
    0
  );
}

export default function DayWorkoutPreview({
  date,
  workouts,
  error,
  onClose,
}: DayWorkoutPreviewProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const dateLabel = date.toLocaleDateString("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-900/30 px-3 pb-[max(100px,calc(env(safe-area-inset-bottom)+100px))] pt-3 backdrop-blur-[2px] sm:items-center sm:pb-3">
      <button
        type="button"
        aria-label="Close workout preview"
        onClick={onClose}
        className="absolute inset-0"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-workout-preview-title"
        className="relative flex max-h-[min(75vh,640px)] w-full max-w-[440px] flex-col overflow-hidden rounded-[1.7rem] border border-white/10 bg-[#1c1c1f] shadow-[0_20px_60px_rgba(27,42,54,0.22)]"
      >
        <header className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#f9a0ae]">
              DAILY TRAINING LOG
            </p>
            <h2 id="day-workout-preview-title" className="mt-1 text-lg font-semibold text-[#f3f2f4]">
              {dateLabel}
            </h2>
            {workouts && (
              <p className="mt-1 text-xs text-[#b8b3ba]">
                {workouts.length} {workouts.length === 1 ? "workout" : "workouts"} logged
              </p>
            )}
          </div>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#303034] text-[#b8b3ba] transition hover:bg-[#404045]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" className="h-4 w-4">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </header>

        <div className="overflow-y-auto px-4 py-4 sm:px-5">
          {error ? (
            <p role="alert" className="rounded-xl border border-[#714342] bg-[#3d2425] px-4 py-3 text-sm text-[#ffa8a4]">
              {error}
            </p>
          ) : workouts === null ? (
            <p role="status" className="py-8 text-center text-sm text-[#aaa5ad]">
              Loading workouts...
            </p>
          ) : workouts.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-[#aaa5ad]">
              No workouts logged for this day.
            </p>
          ) : (
            <div className="space-y-3">
              {workouts.map((workout) => (
                <article key={workout.id} className="rounded-xl border border-white/10 bg-[#27272b] p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-[#f3f2f4]">{workout.name}</h3>
                      <p className="mt-1 text-[10px] font-medium text-[#aaa5ad]">
                        {workout.source === "plan" ? "Planned workout" : "Own workout"}
                        {" · "}
                        {workout.sets.length} {workout.sets.length === 1 ? "set" : "sets"}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#27272b] px-2.5 py-1 text-[10px] font-semibold tabular-nums text-[#cbc7cd]">
                      {formatDuration(workoutTime(workout))}
                    </span>
                  </div>
                  <ol className="mt-3 space-y-2 border-t border-white/10 pt-3">
                    {workout.sets.map((set, index) => (
                      <li key={set.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
                        <span className="font-medium text-[#e2e0e3]">
                          {index + 1}. {set.category}
                        </span>
                        <span className="text-right text-[#b8b3ba]">
                          {set.amount} {set.unit}
                          {set.weightKg !== undefined ? ` · ${set.weightKg} kg` : ""}
                          {" · "}
                          {formatDuration(set.timeSeconds)}
                          {" + "}
                          {formatDuration(set.restSeconds)} rest
                        </span>
                      </li>
                    ))}
                  </ol>
                </article>
              ))}
            </div>
          )}
        </div>

        <footer className="border-t border-white/10 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-[#f16b84] px-4 py-2.5 text-sm font-semibold text-[#290f18] transition hover:bg-[#ff91a5]"
          >
            Close
          </button>
        </footer>
      </section>
    </div>
  );
}
