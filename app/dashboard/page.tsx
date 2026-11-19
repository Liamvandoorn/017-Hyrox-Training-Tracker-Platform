"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AITrainingSummary from "@/components/AITrainingSummary";
import BestTimesBox, { type BestTimeKey, type BestTimes } from "@/components/BestTimesBox";
import ChartContainer from "@/components/ChartContainer";
import DayCarousel from "@/components/DayCarousel";
import DayWorkoutPreview from "@/components/DayWorkoutPreview";
import Navbar from "@/components/Navbar";
import SimpleChart from "@/components/SimpleChart";
import TotalTimeBox from "@/components/TotalTimeBox";
import { WORKOUT_CATEGORIES } from "@/lib/types";
import type { WorkoutRecord, WorkoutSet } from "@/lib/types";

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
  "farmer carries": "farmerCarries",
  "wall balls": "wallBalls",
};
const bestTimeMinimums: Partial<
  Record<BestTimeKey, { amount: number; unit: "m" | "reps"; weightKg?: number }>
> = {
  skiing: { amount: 1000, unit: "m" },
  rowing: { amount: 1000, unit: "m" },
  sledPull: { amount: 12.5, unit: "m", weightKg: 78 },
  sledPush: { amount: 12.5, unit: "m", weightKg: 102 },
  burpeeBroad: { amount: 80, unit: "m" },
  sandbagLunges: { amount: 100, unit: "m", weightKg: 10 },
  farmerCarries: { amount: 200, unit: "m", weightKg: 16 },
  wallBalls: { amount: 100, unit: "reps", weightKg: 4 },
};
const requiredBestTimeKeys: BestTimeKey[] = [
  "running",
  "skiing",
  "rowing",
  "sledPull",
  "sledPush",
  "burpeeBroad",
  "sandbagLunges",
  "farmerCarries",
  "wallBalls",
];

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

function isDashboardWorkoutSet(value: unknown): value is WorkoutSet {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.category === "string" &&
    typeof value.amount === "number" &&
    Number.isFinite(value.amount) &&
    value.amount > 0 &&
    value.amount <= 100000 &&
    (value.weightKg === undefined ||
      (typeof value.weightKg === "number" &&
        Number.isFinite(value.weightKg) &&
        value.weightKg > 0)) &&
    (value.unit === "m" || value.unit === "kg" || value.unit === "reps") &&
    typeof value.timeSeconds === "number" &&
    Number.isInteger(value.timeSeconds) &&
    value.timeSeconds >= 0 &&
    value.timeSeconds <= 86400 &&
    typeof value.restSeconds === "number" &&
    Number.isInteger(value.restSeconds) &&
    value.restSeconds >= 0 &&
    value.restSeconds <= 86400 &&
    typeof value.completed === "boolean"
  );
}

function isDashboardWorkout(value: unknown): value is WorkoutRecord {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.name === "string" &&
    isValidDate(value.date) &&
    (value.source === "own" || value.source === "plan") &&
    Array.isArray(value.sets) &&
    value.sets.every(isDashboardWorkoutSet) &&
    typeof value.created_at === "string"
  );
}

function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMondayStart(timestamp: number): number {
  const day = new Date(timestamp).getUTCDay();
  return timestamp - ((day + 6) % 7) * DAY_MS;
}

function getWeeklyRunningTrend(workouts: WorkoutRecord[]) {
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const currentWeekStart = getMondayStart(today);
  const weekStarts = Array.from(
    { length: WEEK_COUNT },
    (_, index) => currentWeekStart - (WEEK_COUNT - index - 1) * WEEK_MS
  );
  const weeklyMeters = new Map(weekStarts.map((start) => [start, 0]));
  const weeklyWorkouts = new Map(weekStarts.map((start) => [start, 0]));

  for (const workout of workouts) {
    const workoutWeek = getMondayStart(new Date(`${workout.date}T00:00:00.000Z`).getTime());
    if (!weeklyMeters.has(workoutWeek)) continue;
    weeklyWorkouts.set(workoutWeek, (weeklyWorkouts.get(workoutWeek) ?? 0) + 1);

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
    data: exactKilometers,
    workoutCounts: weekStarts.map((start) => weeklyWorkouts.get(start) ?? 0),
    currentWeekKilometers: exactKilometers[exactKilometers.length - 1],
    hasData: exactKilometers.some((distance) => distance > 0),
  };
}

function formatChartDate(date: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00.000Z`));
}

function getExerciseTrends(workouts: WorkoutRecord[]) {
  const dailyTimes = new Map<string, Map<string, number>>(
    WORKOUT_CATEGORIES.map((category) => [category.toLowerCase(), new Map<string, number>()])
  );
  const dailyRunningPaces = new Map<string, number>();

  for (const workout of workouts) {
    for (const set of workout.sets) {
      if (!set.completed || set.timeSeconds <= 0) continue;
      const category = set.category.trim().toLowerCase();
      const days = dailyTimes.get(category);
      if (!days) continue;
      days.set(workout.date, Math.min(days.get(workout.date) ?? Infinity, set.timeSeconds));
      if (category === "running" && set.unit === "m") {
        const pace = Math.round((set.timeSeconds / set.amount) * 1000);
        dailyRunningPaces.set(
          workout.date,
          Math.min(dailyRunningPaces.get(workout.date) ?? Infinity, pace)
        );
      }
    }
  }

  const toPoints = (days: Map<string, number>) =>
    Array.from(days, ([date, seconds]) => ({ date, seconds }))
      .sort((left, right) => left.date.localeCompare(right.date));

  const exerciseTrends = WORKOUT_CATEGORIES.map((category) => ({
    category,
    points: toPoints(dailyTimes.get(category.toLowerCase()) ?? new Map()).slice(-WEEK_COUNT),
  }));
  let runningBest = Infinity;
  const runningBestTrend = toPoints(dailyRunningPaces).map((point) => {
    runningBest = Math.min(runningBest, point.seconds);
    return { ...point, seconds: runningBest };
  }).slice(-WEEK_COUNT);

  return { exerciseTrends, runningBestTrend };
}

function getSimulationHistory(workouts: WorkoutRecord[]) {
  return workouts
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

function getBestExerciseTimes(workouts: WorkoutRecord[]): {
  times: BestTimes;
  seconds: Partial<Record<BestTimeKey, number>>;
} {
  const fastest = new Map<BestTimeKey, { seconds: number; measurement: string }>();

  for (const workout of workouts) {
    for (const set of workout.sets) {
      const key = bestTimeKeys[set.category.trim().toLowerCase()];
      if (!key || !set.completed || set.timeSeconds <= 0) continue;

      let seconds = set.timeSeconds;
      if (key === "running") {
        if (set.unit !== "m") continue;
        seconds = Math.round((set.timeSeconds / set.amount) * 1000);
      } else {
        const minimum = bestTimeMinimums[key];
        if (
          !minimum ||
          set.unit !== minimum.unit ||
          set.amount < minimum.amount ||
          (minimum.weightKg !== undefined &&
            (set.weightKg === undefined || set.weightKg < minimum.weightKg))
        ) {
          continue;
        }
      }

      const currentBest = fastest.get(key);
      if (currentBest && currentBest.seconds <= seconds) continue;

      const amount = Number.isInteger(set.amount) ? String(set.amount) : set.amount.toFixed(1);
      const measurement =
        key === "running"
          ? "1,000 m pace"
          : `${amount} ${set.unit}${set.weightKg ? ` · ${set.weightKg} kg${key === "farmerCarries" ? " / kettlebell" : ""}` : ""}`;
      fastest.set(key, {
        seconds,
        measurement,
      });
    }
  }

  const result: BestTimes = {};
  const seconds: Partial<Record<BestTimeKey, number>> = {};
  for (const [key, best] of fastest) {
    result[key] = `${formatDuration(best.seconds)} · ${best.measurement}`;
    seconds[key] = best.seconds;
  }
  return { times: result, seconds };
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
  const [workouts, setWorkouts] = useState<WorkoutRecord[] | null>(null);
  const [workoutsError, setWorkoutsError] = useState<string | null>(null);
  const [showDayPreview, setShowDayPreview] = useState(false);
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
  const bestExerciseResults = useMemo(
    () => getBestExerciseTimes(workouts ?? []),
    [workouts]
  );
  const { exerciseTrends, runningBestTrend } = useMemo(
    () => getExerciseTrends(workouts ?? []),
    [workouts]
  );
  const bestHyroxSeconds = requiredBestTimeKeys.every(
    (key) => bestExerciseResults.seconds[key] !== undefined
  )
    ? requiredBestTimeKeys.reduce(
        (total, key) =>
          total +
          (bestExerciseResults.seconds[key] ?? 0) * (key === "running" ? 8 : 1),
        0
      )
    : null;
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
      : "No completed timed sets yet. Log a workout to build your HYROX time trend.";
  const bestTimeDetail = workoutsError
    ? "Data unavailable"
    : workouts === null
      ? "Loading..."
      : bestHyroxSeconds === null
        ? "Complete all benchmarks"
        : "Personal best";
  const workoutCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const workout of workouts ?? []) {
      counts[workout.date] = (counts[workout.date] ?? 0) + 1;
    }
    return counts;
  }, [workouts]);
  const selectedDateKey = getDateKey(selectedDate);
  const selectedWorkouts = workouts?.filter((workout) => workout.date === selectedDateKey) ?? null;

  return (
    <main className="min-h-screen px-3 pb-28 pt-5 sm:px-5 sm:pt-8">
      <div className="mx-auto max-w-[760px] space-y-4 sm:space-y-5">
        <header className="flex items-center justify-between px-1 pb-1">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f69aaa]">HYROX · TRAINING LOG</p>
            <h1 className="mt-1 text-[23px] font-semibold tracking-[-0.04em] text-[#f2eff2] sm:text-[28px]">
              Welcome back Marta!
            </h1>
            <p className="mt-0.5 text-xs text-[#aaa5ad] sm:text-sm">
              {selectedDate.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <button
            type="button"
            onClick={signOut}
            aria-label="Sign out"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#28282c] text-[#b8b3ba] shadow-sm transition hover:bg-[#27272b] hover:text-[#f3f2f4]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden="true">
              <path d="M10 17l5-5-5-5M15 12H3" />
              <path d="M12 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
            </svg>
          </button>
        </header>

        <DayCarousel
          workoutCounts={workoutCounts}
          onDaySelect={(date) => {
            setSelectedDate(date);
            setShowDayPreview(true);
          }}
        />

        <section className="grid grid-cols-[minmax(0,1.45fr)_minmax(102px,0.82fr)] gap-3 rounded-[1.7rem] border border-white/10 bg-[#1c1c1f] p-3.5 shadow-[0_14px_38px_rgba(47,68,85,0.08)] sm:gap-5 sm:rounded-[2rem] sm:p-5">
          <BestTimesBox
            times={bestExerciseResults.times}
            status={workoutsError ?? (workouts === null ? "Loading workout data..." : undefined)}
          />
          <TotalTimeBox
            totalTime={bestHyroxSeconds === null ? null : formatDuration(bestHyroxSeconds)}
            lastUpdated={bestTimeDetail}
          />
        </section>

        <section aria-label="Training trends" className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <ChartContainer
            title="Weekly running"
            subtitle={workouts === null ? "Completed distance · km" : `${runningTrend.currentWeekKilometers.toFixed(1)} km this week`}
          >
            {runningTrend.hasData ? (
              <SimpleChart data={runningTrend.data} labels={runningTrend.labels} color="blue" unit="km" description="Weekly running distance in kilometers" />
            ) : (
              <p role={workoutsError ? "alert" : "status"} className="flex h-full items-center justify-center px-1 text-center text-[10px] leading-relaxed text-[#aaa5ad]">
                {runningMessage}
              </p>
            )}
          </ChartContainer>
          <ChartContainer
            title="HYROX simulation"
            subtitle={
              bestSimulationSeconds === null
                ? "Total completed set time · excludes rest"
                : `Best ${formatDuration(bestSimulationSeconds)} · excludes rest`
            }
          >
            {recentSimulationHistory.length ? (
              <SimpleChart
                data={recentSimulationHistory.map((workout) => workout.seconds)}
                labels={recentSimulationHistory.map((workout) => formatChartDate(workout.date))}
                color="orange"
                unit="seconds"
                description="Completed workout set time"
              />
            ) : (
              <p role={workoutsError ? "alert" : "status"} className="flex h-full items-center justify-center px-1 text-center text-[10px] leading-relaxed text-[#aaa5ad]">
                {simulationMessage}
              </p>
            )}
          </ChartContainer>
        </section>

        <AITrainingSummary summary="Your training summary will appear here once workout logging is connected. Keep recording your sessions to see trends in running volume, station pace, and recovery." />

        <section aria-labelledby="exercise-trends-heading" className="space-y-3">
          <div className="px-1">
            <h2 id="exercise-trends-heading" className="text-base font-semibold text-[#f2eff2]">Exercise time trends</h2>
            <p className="mt-1 text-xs text-[#aaa5ad]">
              Fastest completed set per day, excluding rest. Distance, reps and weight can vary between sets.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {exerciseTrends.map(({ category, points }) => (
              <ChartContainer key={category} title={category} subtitle="Fastest set per day · time">
                {points.length ? (
                  <SimpleChart
                    data={points.map((point) => point.seconds)}
                    labels={points.map((point) => formatChartDate(point.date))}
                    unit="seconds"
                    description={`${category} fastest set per day`}
                  />
                ) : (
                  <p role={workoutsError ? "alert" : "status"} className="flex h-full items-center justify-center px-1 text-center text-[10px] leading-relaxed text-[#aaa5ad]">
                    {workoutsError ?? (workouts === null ? "Loading saved workouts..." : "No completed timed sets yet.")}
                  </p>
                )}
              </ChartContainer>
            ))}
          </div>
        </section>

        <section aria-label="Running pace and workout frequency" className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <ChartContainer title="Best running pace" subtitle="Personal best · time per 1,000 m">
            {runningBestTrend.length ? (
              <SimpleChart
                data={runningBestTrend.map((point) => point.seconds)}
                labels={runningBestTrend.map((point) => formatChartDate(point.date))}
                unit="seconds"
                color="green"
                description="Best running average pace per 1,000 meters"
              />
            ) : (
              <p role={workoutsError ? "alert" : "status"} className="flex h-full items-center justify-center px-1 text-center text-[10px] leading-relaxed text-[#aaa5ad]">
                {workoutsError ?? (workouts === null ? "Loading saved workouts..." : "No completed timed runs yet.")}
              </p>
            )}
          </ChartContainer>
          <ChartContainer title="Workout frequency" subtitle="Saved workouts per week">
            {runningTrend.workoutCounts.some((count) => count > 0) ? (
              <SimpleChart
                data={runningTrend.workoutCounts}
                labels={runningTrend.labels}
                unit="count"
                color="green"
                description="Saved workouts per week"
              />
            ) : (
              <p role={workoutsError ? "alert" : "status"} className="flex h-full items-center justify-center px-1 text-center text-[10px] leading-relaxed text-[#aaa5ad]">
                {workoutsError ?? (workouts === null ? "Loading saved workouts..." : "No workouts in the last 7 weeks.")}
              </p>
            )}
          </ChartContainer>
        </section>
      </div>
      <Navbar />
      {showDayPreview && (
        <DayWorkoutPreview
          date={selectedDate}
          workouts={selectedWorkouts}
          error={workoutsError}
          onClose={() => setShowDayPreview(false)}
        />
      )}
    </main>
  );
}
