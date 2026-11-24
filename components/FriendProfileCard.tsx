"use client";

import { useEffect, useState } from "react";
import FriendAvatar from "@/components/FriendAvatar";
import SimpleChart from "@/components/SimpleChart";
import type { BestTimes } from "@/components/BestTimesBox";
import type { WorkoutRecord } from "@/lib/types";

interface FriendStatsResponse {
  userId: number;
  displayName: string;
  bestTimes: BestTimes;
  stats: {
    totalWorkouts: number;
    totalTimeSeconds: number;
    averageTimePerWorkout: number;
  };
  runningTrend: Array<{ date: string; pace: number }>;
  recentWorkouts: WorkoutRecord[];
}

interface FriendProfileCardProps {
  userId: number;
  displayName: string;
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

function formatPace(seconds: number): string {
  if (seconds === 0 || !isFinite(seconds)) return "—";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${minutes}:${String(secs).padStart(2, "0")}/km`;
}

export default function FriendProfileCard({
  userId,
  displayName,
  onClose,
}: FriendProfileCardProps) {
  const [stats, setStats] = useState<FriendStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await fetch(`/api/users/${userId}/stats`, { cache: "no-store" });
        if (!response.ok) {
          setError("Could not load profile");
          return;
        }
        const data: FriendStatsResponse = await response.json();
        setStats(data);
      } catch {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    void loadStats();
  }, [userId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const exercises = [
    { label: "Running", key: "running" },
    { label: "SkiErg", key: "skiing" },
    { label: "Rowing", key: "rowing" },
    { label: "Sled pull", key: "sledPull" },
    { label: "Sled push", key: "sledPush" },
    { label: "Burpee broad jumps", key: "burpeeBroad" },
    { label: "Sandbag lunges", key: "sandbagLunges" },
    { label: "Farmer carries", key: "farmerCarries" },
    { label: "Wall balls", key: "wallBalls" },
  ] as const;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-900/30 px-3 pb-[max(100px,calc(env(safe-area-inset-bottom)+100px))] pt-3 backdrop-blur-[2px] sm:items-center sm:pb-3">
      <button
        type="button"
        aria-label="Close profile"
        onClick={onClose}
        className="absolute inset-0"
      />
      <section
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-[min(85vh,720px)] w-full max-w-[440px] flex-col overflow-hidden rounded-[1.7rem] border border-white/10 bg-[#1c1c1f] shadow-[0_20px_60px_rgba(27,42,54,0.22)]"
      >
        <header className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#f9a0ae]">
              FRIEND PROFILE
            </p>
            <h2 className="mt-1 text-lg font-semibold text-[#f3f2f4]">
              {displayName}
            </h2>
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
          ) : loading ? (
            <p role="status" className="py-8 text-center text-sm text-[#aaa5ad]">
              Loading profile...
            </p>
          ) : stats ? (
            <div className="space-y-5">
              {/* Profile header with avatar */}
              <div className="flex items-center gap-4 pb-4 border-b border-white/10">
                <FriendAvatar userId={userId} displayName={displayName} size={48} />
                <div>
                  <h3 className="text-sm font-semibold text-[#f3f2f4]">{displayName}</h3>
                  <p className="mt-1 text-xs text-[#aaa5ad]">
                    {stats.stats.totalWorkouts} {stats.stats.totalWorkouts === 1 ? "workout" : "workouts"}
                  </p>
                </div>
              </div>

              {/* Stats summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-[#27272b] p-3">
                  <p className="text-[9px] font-medium text-[#aaa5ad]">Total time</p>
                  <p className="mt-1 text-sm font-semibold text-[#f3f2f4]">
                    {formatDuration(stats.stats.totalTimeSeconds)}
                  </p>
                </div>
                <div className="rounded-lg bg-[#27272b] p-3">
                  <p className="text-[9px] font-medium text-[#aaa5ad]">Avg per workout</p>
                  <p className="mt-1 text-sm font-semibold text-[#f3f2f4]">
                    {formatDuration(stats.stats.averageTimePerWorkout)}
                  </p>
                </div>
              </div>

              {/* Best times */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#aaa5ad] mb-3">
                  Best times
                </p>
                <ul className="space-y-0.5">
                  {exercises.map((exercise) => {
                    const value = stats.bestTimes[exercise.key as keyof BestTimes];
                    return (
                      <li key={exercise.label} className="flex items-center justify-between gap-2 border-b border-white/10 py-[5px] last:border-0">
                        <span className="truncate text-[11px] font-medium text-[#b8b3ba] sm:text-xs">
                          {exercise.label}
                        </span>
                        <span className="shrink-0 text-[11px] font-semibold tabular-nums text-[#f3f2f4] sm:text-xs">
                          {value || "—"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Running trend chart */}
              {stats.runningTrend.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#aaa5ad] mb-3">
                    Weekly running pace
                  </p>
                  <div className="rounded-lg bg-[#27272b] p-3 h-32">
                    <SimpleChart
                      data={stats.runningTrend.map((t) => t.pace)}
                      labels={stats.runningTrend.map((t) => t.date.substring(5))}
                      color="blue"
                      unit="seconds"
                      description="Running pace trend"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : null}
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
