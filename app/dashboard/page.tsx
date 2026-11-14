"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AITrainingSummary from "@/components/AITrainingSummary";
import BestTimesBox, { type BestTimeKey, type BestTimes } from "@/components/BestTimesBox";
import ChartContainer from "@/components/ChartContainer";
import DayCarousel from "@/components/DayCarousel";
import Navbar from "@/components/Navbar";
import SimpleChart from "@/components/SimpleChart";
import TotalTimeBox from "@/components/TotalTimeBox";

interface DashboardWorkoutSet {
  category: string;
  amount: number;
  weightKg?: number;
  unit: "m" | "kg" | "reps";
  timeSeconds: number;
  completed: boolean;
}

interface DashboardWorkout {
  name: string;
  date: string;
  sets: DashboardWorkoutSet[];
}

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
const WEEK_COUNT = 7;
const bestTimeKeys: Record<string, BestTimeKey> = {
  running: "running",
  skierg: "skiing",
  rowing: "rowing",
  "sled pull": "sledPull",
  "sled push": "sledPush",
  "burpee broad jumps": "burpeeBroad",
  "sandbag lunges": "sandbagLunges",
  "wall balls": "wallBalls",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isDashboardWorkoutSet(value: unknown): value is DashboardWorkoutSet {
  if (!isRecord(value)) return false;
  return (
    typeof value.category === "string" &&
    typeof value.amount === "number" &&
    Number.isFinite(value.amount) &&
    value.amount > 0 &&
    (value.weightKg === undefined ||
      (typeof value.weightKg === "number" &&
        Number.isFinite(value.weightKg) &&
        value.weightKg > 0)) &&
    (value.unit === "m" || value.unit === "kg" || value.unit === "reps") &&
    typeof value.timeSeconds === "number" &&
    Number.isInteger(value.timeSeconds) &&
    value.timeSeconds >= 0 &&
    value.timeSeconds <= 86400 &&
    typeof value.completed === "boolean"
  );
}

function isDashboardWorkout(value: unknown): value is DashboardWorkout {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    isValidDate(value.date) &&
    Array.isArray(value.sets) &&
    value.sets.every(isDashboardWorkoutSet)
  );
}

function getMondayStart(timestamp: number): number {
  const day = new Date(timestamp).getUTCDay();
  return timestamp - ((day + 6) % 7) * DAY_MS;
}

function getWeeklyRunningTrend(workouts: DashboardWorkout[]) {
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const currentWeekStart = getMondayStart(today);
  const weekStarts = Array.from(
    { length: WEEK_COUNT },
    (_, index) => currentWeekStart - (WEEK_COUNT - index - 1) * WEEK_MS
  );
  const weeklyMeters = new Map(weekStarts.map((start) => [start, 0]));

  for (const workout of workouts) {
    const workoutWeek = getMondayStart(new Date(`${workout.date}T00:00:00.000Z`).getTime());
    if (!weeklyMeters.has(workoutWeek)) continue;

    for (const set of workout.sets) {
      if (set.completed && set.category.trim().toLowerCase() === "running" && set.unit === "m") {
        weeklyMeters.set(workoutWeek, (weeklyMeters.get(workoutWeek) ?? 0) + set.amount);
      }
    }
  }

  const labels = weekStarts.map((start) =>
    new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(start)
  );
  const exactKilometers = weekStarts.map((start) => (weeklyMeters.get(start) ?? 0) / 1000);

  return {
    labels,
    data: exactKilometers.map((distance) => Math.round(distance * 10) / 10),
    currentWeekKilometers: exactKilometers[exactKilometers.length - 1],
    hasData: exactKilometers.some((distance) => distance > 0),
  };
}

function getSimulationHistory(workouts: DashboardWorkout[]) {
  return workouts
    .filter((workout) => /\bsimulation\b/i.test(workout.name))
    .map((workout) => ({
      date: workout.date,
      seconds: workout.sets.reduce(
        (total, set) => total + (set.completed ? set.timeSeconds : 0),
        0
      ),
    }))
    .filter((workout) => workout.seconds > 0)
    .sort((left, right) => left.date.localeCompare(right.date));
}

function getBestExerciseTimes(workouts: DashboardWorkout[]): BestTimes {
  const fastest = new Map<BestTimeKey, { seconds: number; measurement: string }>();

  for (const workout of workouts) {
    for (const set of workout.sets) {
      const key = bestTimeKeys[set.category.trim().toLowerCase()];
      if (!key || !set.completed || set.timeSeconds <= 0) continue;

      const currentBest = fastest.get(key);
      if (currentBest && currentBest.seconds <= set.timeSeconds) continue;

      const amount = Number.isInteger(set.amount) ? String(set.amount) : set.amount.toFixed(1);
      const weight = set.weightKg ? ` · ${set.weightKg} kg` : "";
      fastest.set(key, {
        seconds: set.timeSeconds,
        measurement: `${amount} ${set.unit}${weight}`,
      });
    }
  }

  const result: BestTimes = {};
  for (const [key, best] of fastest) {
    result[key] = `${formatDuration(best.seconds)} · ${best.measurement}`;
  }
  return result;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`
    : `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [workouts, setWorkouts] = useState<DashboardWorkout[] | null>(null);
  const [workoutsError, setWorkoutsError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function loadWorkouts() {
      try {
        const response = await fetch("/api/workouts", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Unable to load saved workouts");
        }

        const payload: unknown = await response.json();
        if (!Array.isArray(payload) || !payload.every(isDashboardWorkout)) {
          throw new Error("Workout data has an unexpected format");
        }

        if (!cancelled) {
          setWorkouts(payload);
          setWorkoutsError(null);
        }
      } catch {
        if (!cancelled) {
          setWorkoutsError("Workout stats could not be loaded.");
        }
      }
    }

    void loadWorkouts();
    return () => {
      cancelled = true;
    };
  }, []);

  const runningTrend = useMemo(
    () => getWeeklyRunningTrend(workouts ?? []),
    [workouts]
  );
  const simulationHistory = useMemo(
    () => getSimulationHistory(workouts ?? []),
    [workouts]
  );
  const bestExerciseTimes = useMemo(
    () => getBestExerciseTimes(workouts ?? []),
    [workouts]
  );
  const bestSimulationSeconds = simulationHistory.length
    ? Math.min(...simulationHistory.map((workout) => workout.seconds))
    : null;
  const recentSimulationHistory = simulationHistory.slice(-WEEK_COUNT);

  const signOut = () => {
    localStorage.removeItem("hyrox_authenticated");
    router.replace("/");
  };

  const runningMessage = workoutsError
    ? workoutsError
    : workouts === null
      ? "Loading saved workouts..."
      : "No completed running distance in the last 7 weeks.";
  const simulationMessage = workoutsError
    ? workoutsError
    : workouts === null
      ? "Loading saved workouts..."
      : "No HYROX simulation time yet. Log a workout named “Simulation” with timed sets.";
  const bestTimeDetail = workoutsError
    ? "Data unavailable"
    : workouts === null
      ? "Loading..."
      : bestSimulationSeconds === null
        ? "No simulation yet"
        : "Personal best";

  return (
    <main className="min-h-screen px-3 pb-28 pt-5 sm:px-5 sm:pt-8">
      <div className="mx-auto max-w-[760px] space-y-4 sm:space-y-5">
        <header className="flex items-center justify-between px-1 pb-1">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#66839a]">HYROX · TRAINING LOG</p>
            <h1 className="mt-1 text-[23px] font-semibold tracking-[-0.04em] text-[#202d37] sm:text-[28px]">
              Welcome back Marta!
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
              {selectedDate.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <button
            type="button"
            onClick={signOut}
            aria-label="Sign out"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/80 bg-white/70 text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-800"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden="true">
              <path d="M10 17l5-5-5-5M15 12H3" />
              <path d="M12 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
            </svg>
          </button>
        </header>

        <DayCarousel onDaySelect={setSelectedDate} />

        <section className="grid grid-cols-[minmax(0,1.45fr)_minmax(102px,0.82fr)] gap-3 rounded-[1.7rem] border border-white/85 bg-white/85 p-3.5 shadow-[0_14px_38px_rgba(47,68,85,0.08)] sm:gap-5 sm:rounded-[2rem] sm:p-5">
          <BestTimesBox
            times={bestExerciseTimes}
            status={workoutsError ?? (workouts === null ? "Loading workout data..." : undefined)}
          />
          <TotalTimeBox
            totalTime={bestSimulationSeconds === null ? null : formatDuration(bestSimulationSeconds)}
            lastUpdated={bestTimeDetail}
          />
        </section>

        <section aria-label="Training trends" className="grid grid-cols-2 gap-3 sm:gap-4">
          <ChartContainer
            title="Weekly running"
            subtitle={workouts === null ? "Completed distance · km" : `${runningTrend.currentWeekKilometers.toFixed(1)} km this week`}
          >
            {runningTrend.hasData ? (
              <SimpleChart data={runningTrend.data} labels={runningTrend.labels} color="blue" />
            ) : (
              <p role={workoutsError ? "alert" : "status"} className="flex h-full items-center justify-center px-1 text-center text-[10px] leading-relaxed text-slate-400">
                {runningMessage}
              </p>
            )}
          </ChartContainer>
          <ChartContainer
            title="HYROX simulation"
            subtitle={
              bestSimulationSeconds === null
                ? "Total set time · excludes rest"
                : `Best ${formatDuration(bestSimulationSeconds)} · excludes rest`
            }
          >
            {recentSimulationHistory.length ? (
              <SimpleChart
                data={recentSimulationHistory.map((workout) => Math.round((workout.seconds / 60) * 10) / 10)}
                labels={recentSimulationHistory.map((workout) =>
                  new Intl.DateTimeFormat("en", {
                    month: "short",
                    day: "numeric",
                    timeZone: "UTC",
                  }).format(new Date(`${workout.date}T00:00:00.000Z`))
                )}
                color="orange"
              />
            ) : (
              <p role={workoutsError ? "alert" : "status"} className="flex h-full items-center justify-center px-1 text-center text-[10px] leading-relaxed text-slate-400">
                {simulationMessage}
              </p>
            )}
          </ChartContainer>
        </section>

        <AITrainingSummary summary="Your training summary will appear here once workout logging is connected. Keep recording your sessions to see trends in running volume, station pace, and recovery." />
      </div>
      <Navbar />
    </main>
  );
}
