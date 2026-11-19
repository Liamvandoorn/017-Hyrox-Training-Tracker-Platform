"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import WorkoutStartSheet, { WorkoutFlow } from "@/components/WorkoutStartSheet";
import {
  getWorkoutSetUnit,
  requiresWeight,
  WORKOUT_CATEGORIES,
} from "@/lib/types";
import type { WorkoutPlan, WorkoutSet, WorkoutSetUnit, WorkoutSource } from "@/lib/types";

type PageMode = "choose" | "plan" | "workout" | "finished";

interface RestTimer {
  setId: string;
  durationSeconds: number;
  endsAt: number;
}

function localDateValue() {
  const date = new Date();
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function parseTime(value: string) {
  const match = /^(\d{1,3}):([0-5]\d)$/.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isWorkoutPlan(value: unknown): value is WorkoutPlan {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.name === "string" &&
    Array.isArray(value.sets) &&
    value.sets.every(
      (set) =>
        isRecord(set) &&
        typeof set.id === "string" &&
        typeof set.category === "string" &&
        typeof set.amount === "number" &&
        Number.isFinite(set.amount) &&
        set.amount > 0 &&
        (set.unit === "m" || set.unit === "kg" || set.unit === "reps") &&
        (set.weightKg === undefined ||
          (typeof set.weightKg === "number" && Number.isFinite(set.weightKg))) &&
        typeof set.timeSeconds === "number" &&
        Number.isInteger(set.timeSeconds) &&
        typeof set.restSeconds === "number" &&
        Number.isInteger(set.restSeconds) &&
        typeof set.completed === "boolean"
    ) &&
    typeof value.created_at === "string" &&
    typeof value.updated_at === "string"
  );
}

interface TimeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  onBlur?: React.FocusEventHandler<HTMLDivElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
  className?: string;
}

function TimeInput({ label, value, onChange, autoFocus, onBlur, onKeyDown, className }: TimeInputProps) {
  const [minutes = "", seconds = ""] = value.split(":");

  return (
    <div
      role="group"
      aria-label={label}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      className={className ?? "flex h-10 items-center justify-center rounded-lg border border-white/10 bg-[#27272b] px-1 focus-within:border-[#91576a]"}
    >
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={3}
        autoFocus={autoFocus}
        onFocus={(event) => {
          if (autoFocus) event.currentTarget.select();
        }}
        value={minutes}
        onChange={(event) =>
          onChange(`${event.target.value.replace(/\D/g, "").slice(0, 3)}:${seconds}`)
        }
        aria-label={`${label} minutes`}
        className="min-w-0 w-1/2 bg-transparent text-center text-xs font-semibold tabular-nums text-[#e2e0e3] outline-none"
      />
      <span aria-hidden="true" className="text-xs font-semibold text-[#b8b3ba]">:</span>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={2}
        value={seconds}
        onChange={(event) =>
          onChange(`${minutes}:${event.target.value.replace(/\D/g, "").slice(0, 2)}`)
        }
        aria-label={`${label} seconds`}
        className="min-w-0 w-1/2 bg-transparent text-center text-xs font-semibold tabular-nums text-[#e2e0e3] outline-none"
      />
    </div>
  );
}

function formatVolume(amount: number, unit: WorkoutSetUnit) {
  if (unit === "m" && amount >= 1000) return `${(amount / 1000).toFixed(1)} km`;
  return `${amount.toLocaleString()} ${unit}`;
}

interface EditableValueProps {
  value: string;
  suffix?: string;
  label: string;
  fieldLabel: string;
  inputMode?: "decimal" | "text";
  isTime?: boolean;
  onSave: (value: string) => void;
}

function EditableValue({
  value,
  suffix,
  label,
  fieldLabel,
  inputMode = "text",
  isTime = false,
  onSave,
}: EditableValueProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const save = () => {
    setEditing(false);
    onSave(draft.trim());
  };

  return (
    <div className="flex min-w-0 flex-col items-start gap-1">
      <span className="text-[9px] font-semibold uppercase tracking-wide text-[#aaa5ad]">{fieldLabel}</span>
      {editing && isTime ? (
        <TimeInput
          label={label}
          value={draft}
          onChange={setDraft}
          autoFocus
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) save();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              save();
            } else if (event.key === "Escape") {
              event.preventDefault();
              setDraft(value);
              setEditing(false);
            }
          }}
          className="flex h-8 w-[86px] items-center justify-center rounded-lg border border-[#91576a] bg-[#27272b] px-1 focus-within:ring-2 focus-within:ring-[#dce8f0]"
        />
      ) : editing ? (
        <input
          autoFocus
          onFocus={(event) => event.currentTarget.select()}
          aria-label={label}
          inputMode={inputMode}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={save}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
            if (event.key === "Escape") {
              setDraft(value);
              setEditing(false);
            }
          }}
          className="h-8 w-[70px] rounded-lg border border-[#91576a] bg-[#27272b] px-2 py-1 text-left text-sm font-semibold tabular-nums text-[#f3f2f4] outline-none focus:ring-2 focus:ring-[#dce8f0]"
        />
      ) : (
        <button
          type="button"
          aria-label={`Edit ${label}`}
          onClick={() => {
            setDraft(value);
            setEditing(true);
          }}
          className="inline-flex min-h-8 items-center justify-start gap-1 rounded-md border border-white/10 bg-[#303034] px-1.5 py-1 text-left text-sm font-semibold tabular-nums text-[#e2e0e3] transition hover:border-[#91576a] hover:bg-[#303034] hover:text-[#ffb0bd]"
        >
          {value}{suffix ? <span className="ml-1 text-[10px] font-medium text-[#aaa5ad]">{suffix}</span> : null}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 shrink-0 text-[#aaa5ad]" aria-hidden="true">
            <path d="m15 5 4 4M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4Z" />
          </svg>
        </button>
      )}
    </div>
  );
}

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="m5 12.5 4.2 4.2L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function WorkoutPage() {
  const router = useRouter();
  const [mode, setMode] = useState<PageMode>("choose");
  const [source, setSource] = useState<WorkoutSource>("own");
  const [workoutName, setWorkoutName] = useState("My workout");
  const [date, setDate] = useState(localDateValue);
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [availablePlans, setAvailablePlans] = useState<WorkoutPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [plansError, setPlansError] = useState("");
  const [category, setCategory] = useState<string>(WORKOUT_CATEGORIES[0]);
  const [amount, setAmount] = useState("500");
  const [weight, setWeight] = useState("50");
  const [time, setTime] = useState("02:40");
  const [restTime, setRestTime] = useState("01:00");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("My workout");
  const [showAbortConfirmation, setShowAbortConfirmation] = useState(false);
  const [pendingFlow, setPendingFlow] = useState<WorkoutFlow | null>(null);
  const [showStartSheet, setShowStartSheet] = useState(true);
  const [restTimer, setRestTimer] = useState<RestTimer | null>(null);
  const [restRemaining, setRestRemaining] = useState(0);

  useEffect(() => {
    if (!restTimer) return;

    const updateRemaining = () => {
      setRestRemaining(Math.max(0, Math.ceil((restTimer.endsAt - Date.now()) / 1000)));
    };
    updateRemaining();
    const interval = window.setInterval(() => {
      updateRemaining();
      if (Date.now() >= restTimer.endsAt) window.clearInterval(interval);
    }, 250);
    const onVisibilityChange = () => updateRemaining();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [restTimer]);

  const totalTime = useMemo(
    () => sets.reduce((total, set) => total + set.timeSeconds, 0),
    [sets]
  );
  const totalRestTime = useMemo(
    () => sets.reduce((total, set) => total + set.restSeconds, 0),
    [sets]
  );
  const totalDistance = useMemo(
    () => sets.filter((set) => set.unit === "m").reduce((total, set) => total + set.amount, 0),
    [sets]
  );
  const totalWeight = useMemo(
    () =>
      sets.reduce(
        (total, set) =>
          total +
          (set.weightKg ?? (set.unit === "kg" ? set.amount : 0)) *
            (set.category === "Farmer carries" ? 2 : 1),
        0
      ),
    [sets]
  );
  const totalReps = useMemo(
    () => sets.filter((set) => set.unit === "reps").reduce((total, set) => total + set.amount, 0),
    [sets]
  );

  const startOwnWorkout = useCallback(() => {
    setRestTimer(null);
    setShowStartSheet(false);
    setSource("own");
    setWorkoutName("My workout");
    setNameDraft("My workout");
    setDate(localDateValue());
    setSets([]);
    setError("");
    setShowAbortConfirmation(false);
    setPendingFlow(null);
    setMode("workout");
  }, []);

  const startPlannedWorkout = (plan: WorkoutPlan) => {
    setRestTimer(null);
    setShowStartSheet(false);
    setSource("plan");
    setWorkoutName(plan.name);
    setNameDraft(plan.name);
    setDate(localDateValue());
    setSets(
      plan.sets.map((set) => ({
        ...set,
        id: crypto.randomUUID(),
        completed: false,
      }))
    );
    setError("");
    setShowAbortConfirmation(false);
    setPendingFlow(null);
    setMode("workout");
  };

  const addSet = () => {
    setError("");
    const numericAmount = Number(amount);
    const numericWeight = Number(weight);
    const timeSeconds = parseTime(time);
    const restSeconds = parseTime(restTime);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Enter a distance, weight, or rep count greater than zero.");
      return;
    }
    if (
      requiresWeight(category) &&
      (!Number.isFinite(numericWeight) || numericWeight <= 0)
    ) {
      setError("Enter a weight greater than zero.");
      return;
    }
    if (getWorkoutSetUnit(category) === "reps" && !Number.isInteger(numericAmount)) {
      setError("Repetitions must be a whole number.");
      return;
    }
    if (timeSeconds === null) {
      setError("Enter time in minutes and seconds, for example 02:40.");
      return;
    }
    if (restSeconds === null) {
      setError("Enter rest time in minutes and seconds, for example 01:00.");
      return;
    }
    if (sets.length >= 100) {
      setError("A workout can contain up to 100 sets.");
      return;
    }

    setSets((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        category,
        amount: numericAmount,
        unit: getWorkoutSetUnit(category),
        ...(requiresWeight(category) ? { weightKg: numericWeight } : {}),
        timeSeconds,
        restSeconds,
        completed: false,
      },
    ]);
  };

  const updateSet = (id: string, changes: Partial<WorkoutSet>) => {
    setSets((current) =>
      current.map((set) => (set.id === id ? { ...set, ...changes } : set))
    );
  };

  const toggleSetCompletion = (set: WorkoutSet) => {
    updateSet(set.id, { completed: !set.completed });
    if (set.completed) {
      setRestTimer((current) => current?.setId === set.id ? null : current);
    } else if (set.restSeconds > 0) {
      setRestRemaining(set.restSeconds);
      setRestTimer({
        setId: set.id,
        durationSeconds: set.restSeconds,
        endsAt: Date.now() + set.restSeconds * 1000,
      });
    } else {
      setRestTimer(null);
    }
  };

  const updateSetAmount = (set: WorkoutSet, value: string) => {
    const nextAmount = Number(value);
    if (!Number.isFinite(nextAmount) || nextAmount <= 0) {
      setError("Set value must be greater than zero.");
      return;
    }
    if (set.unit === "reps" && !Number.isInteger(nextAmount)) {
      setError("Repetitions must be a whole number.");
      return;
    }
    setError("");
    updateSet(set.id, { amount: nextAmount });
  };

  const updateSetWeight = (set: WorkoutSet, value: string) => {
    const nextWeight = Number(value);
    if (!Number.isFinite(nextWeight) || nextWeight <= 0) {
      setError("Weight must be greater than zero.");
      return;
    }
    setError("");
    updateSet(set.id, { weightKg: nextWeight });
  };

  const updateSetTime = (set: WorkoutSet, value: string) => {
    const nextTime = parseTime(value);
    if (nextTime === null) {
      setError("Use minutes and seconds, for example 02:40.");
      return;
    }
    setError("");
    updateSet(set.id, { timeSeconds: nextTime });
  };

  const updateSetRest = (set: WorkoutSet, value: string) => {
    const nextRest = parseTime(value);
    if (nextRest === null) {
      setError("Use minutes and seconds for rest, for example 01:00.");
      return;
    }
    setError("");
    updateSet(set.id, { restSeconds: nextRest });
  };

  const finishWorkout = async () => {
    if (sets.length === 0 || !date) {
      setError("Add at least one set and choose a workout date.");
      return;
    }
    if (!workoutName.trim()) {
      setError("Add a name for your workout.");
      return;
    }

    setIsSaving(true);
    setError("");
    const completedSets = sets.map((set) => ({ ...set, completed: true }));

    try {
      const response = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workoutName.trim(),
          date,
          source,
          sets: completedSets,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Could not save your workout.");
      }
      setSets(completedSets);
      setRestTimer(null);
      setMode("finished");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save your workout.");
    } finally {
      setIsSaving(false);
    }
  };

  const resetWorkout = () => {
    setRestTimer(null);
    setSets([]);
    setError("");
    setPendingFlow(null);
    setShowStartSheet(true);
    setMode("choose");
  };

  const changeCategory = (nextCategory: string) => {
    setCategory(nextCategory);
    setAmount(
      nextCategory === "Farmer carries"
        ? "200"
        : nextCategory === "Wall balls"
          ? "100"
        : getWorkoutSetUnit(nextCategory) === "m"
          ? "500"
          : "20"
    );
    setWeight(
      nextCategory === "Farmer carries"
        ? "16"
        : nextCategory === "Wall balls"
          ? "4"
          : "50"
    );
  };

  const groupedSets = sets.reduce<Record<string, WorkoutSet[]>>((groups, set) => {
    groups[set.category] ??= [];
    groups[set.category].push(set);
    return groups;
  }, {});

  useEffect(() => {
    const handleOpenWorkoutSheet = () => setShowStartSheet(true);
    const handleWorkoutFlow = () => {
      const flow = sessionStorage.getItem("hyrox_workout_flow");
      if (flow !== "own" && flow !== "plan") return;
      sessionStorage.removeItem("hyrox_workout_flow");

      if (mode === "workout" && sets.length > 0) {
        setPendingFlow(flow);
        setShowAbortConfirmation(true);
        return;
      }

      if (flow === "own") {
        startOwnWorkout();
      } else {
        setShowStartSheet(false);
        setMode("plan");
      }
    };

    window.addEventListener("hyrox-workout-flow", handleWorkoutFlow);
    window.addEventListener("hyrox-open-workout-sheet", handleOpenWorkoutSheet);
    handleWorkoutFlow();
    return () => {
      window.removeEventListener("hyrox-workout-flow", handleWorkoutFlow);
      window.removeEventListener("hyrox-open-workout-sheet", handleOpenWorkoutSheet);
    };
  }, [mode, sets, startOwnWorkout]);

  const abortWorkout = () => {
    setShowAbortConfirmation(false);
    setRestTimer(null);
    setSets([]);
    setError("");
    setIsEditingName(false);

    if (pendingFlow === "own") {
      setPendingFlow(null);
      startOwnWorkout();
    } else if (pendingFlow === "plan") {
      setPendingFlow(null);
      setShowStartSheet(false);
      setMode("plan");
    } else {
      resetWorkout();
    }
  };

  useEffect(() => {
    if (mode !== "plan") return;
    let cancelled = false;

    async function loadPlans() {
      setIsLoadingPlans(true);
      setPlansError("");
      try {
        const response = await fetch("/api/plans", { cache: "no-store" });
        const payload: unknown = await response.json();
        if (
          !response.ok ||
          !Array.isArray(payload) ||
          !payload.every(isWorkoutPlan)
        ) {
          throw new Error(
            isRecord(payload) && typeof payload.error === "string"
              ? payload.error
              : "Could not load workout plans."
          );
        }
        if (!cancelled) setAvailablePlans(payload);
      } catch (loadError) {
        if (!cancelled) {
          setPlansError(
            loadError instanceof Error ? loadError.message : "Could not load workout plans."
          );
        }
      } finally {
        if (!cancelled) setIsLoadingPlans(false);
      }
    }

    void loadPlans();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  return (
    <main className={`min-h-screen px-3 pt-5 sm:px-5 sm:pt-8 ${mode === "workout" ? "pb-[310px]" : "pb-28"}`}>
      <div className="mx-auto max-w-[680px]">
        <header className="mb-5 flex items-start justify-between gap-3 px-1">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f69aaa]">HYROX · TRAINING LOG</p>
            <h1 className="mt-1 text-[25px] font-semibold tracking-[-0.04em] text-[#f2eff2] sm:text-[28px]">
              {mode === "finished" ? "Workout complete" : "Log workout"}
            </h1>
            <p className="mt-1 text-sm text-[#aaa5ad]">
              {mode === "choose" ? "How would you like to train today?" : mode === "finished" ? "Your session has been saved." : "Build your session, one set at a time."}
            </p>
          </div>
          {mode === "workout" && (
            <div className="flex shrink-0 flex-col items-center gap-1">
              <button
                type="button"
                onClick={finishWorkout}
                disabled={!sets.length || isSaving}
                aria-label="Finish workout"
                className="flex flex-col items-center gap-1 text-[10px] font-semibold text-[#cbc7cd] disabled:opacity-40"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_6px_16px_rgba(16,185,129,0.28)] transition hover:bg-emerald-600">
                  {isSaving ? <span className="text-xs">…</span> : <CheckIcon className="h-5 w-5" />}
                </span>
                {isSaving ? "Saving" : "Finish"}
              </button>
              <button
                type="button"
                onClick={() => setShowAbortConfirmation(true)}
                disabled={isSaving}
                className="rounded-full px-2 py-1 text-[10px] font-semibold text-[#ffaaa5] hover:bg-[#3d2425] disabled:opacity-40"
              >
                Abort workout
              </button>
            </div>
          )}
        </header>

        {error && (
          <div role="alert" className="mb-4 rounded-xl border border-[#714342] bg-[#3d2425] px-4 py-3 text-sm text-[#ffa8a4]">
            {error}
          </div>
        )}

        {mode === "choose" && (
          <div className="rounded-[1.8rem] border border-white/10 bg-[#1c1c1f] p-5 text-sm text-[#b8b3ba]">
            Choose a workout option to get started.
          </div>
        )}

        {mode === "plan" && (
          <div className="rounded-[1.8rem] border border-white/10 bg-[#1c1c1f] p-5 text-sm text-[#b8b3ba]">
            Choose one of your saved plans to start a workout.
          </div>
        )}

        {mode === "workout" && (
          <div className="space-y-4">
            <section className="rounded-[1.8rem] border border-white/10 bg-[#1c1c1f] p-5 shadow-[0_12px_30px_rgba(47,68,85,0.06)] sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#f9a0ae]">WORKOUT NAME · TAP TO EDIT</p>
                  {isEditingName ? (
                    <input
                      autoFocus
                      value={nameDraft}
                      onChange={(event) => {
                        setNameDraft(event.target.value);
                        setWorkoutName(event.target.value);
                      }}
                      onBlur={() => {
                        const nextName = nameDraft.trim() || "My workout";
                        setWorkoutName(nextName);
                        setNameDraft(nextName);
                        setIsEditingName(false);
                      }}
                      onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
                      aria-label="Workout name"
                      className="mt-1 w-full border-b border-[#91576a] bg-transparent py-1 text-lg font-semibold text-[#f3f2f4] outline-none"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setNameDraft(workoutName);
                        setIsEditingName(true);
                      }}
                      className="mt-1 flex max-w-full items-center gap-2 text-left text-lg font-semibold tracking-tight text-[#f3f2f4]"
                    >
                      <span className="truncate">{workoutName}</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-[#aaa5ad]" aria-hidden="true">
                        <path d="m15 5 4 4M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4Z" />
                      </svg>
                    </button>
                  )}
                </div>
                {source === "plan" && <span className="rounded-full bg-[#30282d] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-[#ffadba]">Planned</span>}
              </div>
              <label className="mt-4 block text-[10px] font-semibold uppercase tracking-wide text-[#aaa5ad]" htmlFor="workout-date">Day</label>
              <input
                id="workout-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="mt-1 rounded-lg border border-white/10 bg-[#27272b] px-3 py-2 text-sm font-medium text-[#e2e0e3] outline-none focus:border-[#91576a]"
              />
            </section>

            <section className="rounded-[1.8rem] border border-white/10 bg-[#1c1c1f] p-5 shadow-[0_12px_30px_rgba(47,68,85,0.06)] sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-[#f3f2f4]">Added sets</h2>
                <span className="rounded-full bg-[#30282d] px-2.5 py-1 text-[10px] font-semibold text-[#b8b3ba]">{sets.length} {sets.length === 1 ? "set" : "sets"}</span>
              </div>
              {sets.length > 0 && (
                <p className="mb-3 text-xs text-[#b8b3ba]">
                  Tap a set value to edit it{source === "plan" ? "; your saved plan stays unchanged" : ""}.
                </p>
              )}
              {sets.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 bg-[#242427] px-4 py-6 text-center text-xs text-[#aaa5ad]">
                  No sets yet. Add your first set below.
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedSets).map(([groupCategory, categorySets]) => (
                    <section key={groupCategory} aria-label={`${groupCategory} sets`}>
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-xs font-semibold text-[#cbc7cd]">{groupCategory}</h3>
                        <span className="text-[10px] text-[#aaa5ad]">{categorySets.length} {categorySets.length === 1 ? "set" : "sets"}</span>
                      </div>
                      <ol className="space-y-2">
                        {categorySets.map((set, index) => (
                          <li key={set.id} className={`grid grid-cols-[36px_minmax(0,1fr)] items-center gap-x-2 gap-y-1 rounded-xl border px-2 py-2 transition ${set.completed ? "border-[#36594a] bg-[#1d3028]" : "border-white/10 bg-[#27272b]"}`}>
                            <button
                              type="button"
                              aria-label={`${set.completed ? "Reopen" : "Complete"} set ${index + 1}`}
                              aria-pressed={set.completed}
                              onClick={() => toggleSetCompletion(set)}
                              className={`row-span-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition ${
                                set.completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-white/10 bg-[#27272b] text-[#cbc7cd] hover:border-emerald-400"
                              }`}
                            >
                              {set.completed ? <CheckIcon /> : index + 1}
                            </button>
                            <span className="min-w-0">
                              <span className={`block text-[9px] ${set.completed ? "text-[#8ed9b1]" : "text-[#aaa5ad]"}`}>{set.completed ? "Completed" : `Set ${index + 1}`}</span>
                            </span>
                            <div className="flex min-w-0 flex-wrap items-start justify-start gap-x-2 gap-y-2">
                              <EditableValue
                                label={`set ${index + 1} ${set.unit}`}
                                fieldLabel={set.unit === "m" ? "Distance" : set.unit === "reps" ? "Reps" : "Weight"}
                                value={String(set.amount)}
                                suffix={set.unit}
                                inputMode="decimal"
                                onSave={(value) => updateSetAmount(set, value)}
                              />
                              {set.weightKg !== undefined && (
                                <EditableValue
                                  label={
                                    set.category === "Farmer carries"
                                      ? `set ${index + 1} weight per kettlebell`
                                      : `set ${index + 1} weight`
                                  }
                                  fieldLabel={set.category === "Farmer carries" ? "Weight / bell" : "Weight"}
                                  value={String(set.weightKg)}
                                  suffix={set.category === "Farmer carries" ? "kg / bell" : "kg"}
                                  inputMode="decimal"
                                  onSave={(value) => updateSetWeight(set, value)}
                                />
                              )}
                              <EditableValue
                                label={`set ${index + 1} time`}
                                fieldLabel="Time"
                                isTime
                                value={formatTime(set.timeSeconds)}
                                onSave={(value) => updateSetTime(set, value)}
                              />
                              <EditableValue
                                label={`set ${index + 1} rest time`}
                                fieldLabel="Rest"
                                isTime
                                value={formatTime(set.restSeconds)}
                                onSave={(value) => updateSetRest(set, value)}
                              />
                            </div>
                            {restTimer?.setId === set.id && (
                              <section aria-label="Rest timer" className="col-start-2 min-w-0 pt-2">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-semibold text-[#cbc7cd]">
                                    {restRemaining > 0 ? "Rest remaining" : "Rest complete"}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span aria-label={`${restRemaining} seconds remaining`} className="text-sm font-semibold tabular-nums text-[#f3f2f4]">
                                      {formatTime(restRemaining)}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setRestTimer(null)}
                                      className="rounded-lg bg-[#27272b] px-2 py-1 text-[10px] font-semibold text-[#cbc7cd] hover:bg-[#303034]"
                                    >
                                      {restRemaining > 0 ? "Skip rest" : "Dismiss"}
                                    </button>
                                  </div>
                                </div>
                                <div
                                  role="progressbar"
                                  aria-label="Rest time remaining"
                                  aria-valuemin={0}
                                  aria-valuemax={restTimer.durationSeconds}
                                  aria-valuenow={restRemaining}
                                  aria-valuetext={`${formatTime(restRemaining)} remaining`}
                                  className="mt-2 h-2 overflow-hidden rounded-full bg-[#27362f]"
                                >
                                  <div
                                    className="h-full rounded-full bg-[#f16b84] transition-[width] duration-300"
                                    style={{ width: `${(restRemaining / restTimer.durationSeconds) * 100}%` }}
                                  />
                                </div>
                                {restRemaining === 0 && <p role="status" className="mt-2 text-xs font-semibold text-[#8ed9b1]">Rest complete. Ready for your next set.</p>}
                              </section>
                            )}
                          </li>
                        ))}
                      </ol>
                    </section>
                  ))}
                </div>
              )}
            </section>

          </div>
        )}

        {mode === "finished" && (
          <section className="rounded-[1.8rem] border border-white/10 bg-[#1c1c1f] p-5 shadow-[0_12px_30px_rgba(47,68,85,0.06)] sm:p-7">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white">
                <CheckIcon className="h-6 w-6" />
              </span>
              <div>
                <h2 className="font-semibold text-[#f3f2f4]">{workoutName}</h2>
                <p className="text-xs text-[#b8b3ba]">{new Date(`${date}T12:00:00`).toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" })} · saved to training log</p>
              </div>
            </div>
            <div className="mb-5 rounded-2xl bg-[#1d3028] p-4">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[#a6e6c1]">
                <span>Workout progress</span>
                <span>100%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#294236]">
                <div className="h-full w-full rounded-full bg-emerald-500" />
              </div>
              <p className="mt-2 text-[10px] text-[#8ed9b1]">All {sets.length} {sets.length === 1 ? "set" : "sets"} marked complete.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Sets done" value={`${sets.length}/${sets.length}`} />
              <Stat label="Set time" value={formatTime(totalTime)} />
              <Stat label="Total rest" value={formatTime(totalRestTime)} />
              {totalDistance > 0 && <Stat label="Distance" value={formatVolume(totalDistance, "m")} />}
              {totalWeight > 0 && <Stat label="Total weight" value={formatVolume(totalWeight, "kg")} />}
              {totalReps > 0 && <Stat label="Total reps" value={formatVolume(totalReps, "reps")} />}
            </div>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="mt-6 w-full rounded-xl bg-[#f16b84] px-4 py-3 text-sm font-semibold text-[#290f18] transition hover:bg-[#ff91a5]"
            >
              Back to dashboard
            </button>
            <button type="button" onClick={resetWorkout} className="mt-3 w-full py-2 text-xs font-semibold text-[#b8b3ba] hover:text-[#f3f2f4]">
              Log another workout
            </button>
          </section>
        )}
      </div>

      {showStartSheet && mode !== "plan" && (
        <WorkoutStartSheet
          onClose={() => {
            setShowStartSheet(false);
            if (mode === "choose") router.push("/dashboard");
          }}
          onSelect={(flow) => {
            setShowStartSheet(false);
            if (mode === "workout" && sets.length > 0) {
              setPendingFlow(flow);
              setShowAbortConfirmation(true);
            } else if (flow === "own") {
              startOwnWorkout();
            } else {
              setMode("plan");
            }
          }}
        />
      )}

      {mode === "plan" && (
        <div className="fixed inset-0 z-[60]">
          <button
            type="button"
            aria-label="Close planned workouts"
            onClick={() => {
              setMode("choose");
              setShowStartSheet(true);
            }}
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px]"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="planned-workout-title"
            className="workout-sheet absolute left-1/2 max-h-[min(72vh,620px)] w-[calc(100%-24px)] max-w-[420px] -translate-x-1/2 overflow-y-auto rounded-[1.7rem] border border-white/10 bg-[#1c1c1f] p-5 shadow-[0_20px_60px_rgba(27,42,54,0.22)]"
            style={{ bottom: "calc(max(12px, env(safe-area-inset-bottom)) + 88px)" }}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#f9a0ae]">SAVED WORKOUT PLANS</p>
                <h2 id="planned-workout-title" className="mt-1 text-lg font-semibold text-[#f3f2f4]">Choose a plan</h2>
                <p className="mt-1 text-xs text-[#b8b3ba]">The plan&apos;s sets will be copied into today&apos;s workout.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMode("choose");
                  setShowStartSheet(true);
                }}
                aria-label="Back to workout options"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#303034] text-[#b8b3ba] hover:bg-[#404045]"
              >
                ×
              </button>
            </div>
            {isLoadingPlans && <p role="status" className="py-6 text-center text-sm text-[#aaa5ad]">Loading plans...</p>}
            {plansError && <p role="alert" className="rounded-lg border border-[#714342] bg-[#3d2425] px-3 py-2 text-sm text-[#ffa8a4]">{plansError}</p>}
            {!isLoadingPlans && !plansError && availablePlans.length === 0 && (
              <div className="rounded-xl border border-dashed border-white/10 px-4 py-5 text-center">
                <p className="text-sm font-medium text-[#e2e0e3]">No saved plans yet.</p>
                <p className="mt-1 text-xs text-[#b8b3ba]">Create a workout plan in Settings first.</p>
                <button
                  type="button"
                  onClick={() => router.push("/settings")}
                  className="mt-3 rounded-lg bg-[#f16b84] px-3 py-2 text-xs font-semibold text-[#290f18] hover:bg-[#ff91a5]"
                >
                  Open Settings
                </button>
              </div>
            )}
            <div className="space-y-3">
              {availablePlans.map((plan) => (
                <article key={plan.id} className="rounded-xl border border-white/10 bg-[#27272b] p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="truncate text-sm font-semibold text-[#f3f2f4]">{plan.name}</h3>
                    <span className="shrink-0 text-[10px] text-[#aaa5ad]">{plan.sets.length} sets</span>
                  </div>
                  <ol className="mb-3 max-h-32 space-y-1 overflow-y-auto">
                    {plan.sets.map((set, index) => (
                      <li key={set.id} className="flex justify-between gap-2 text-[10px] text-[#b8b3ba]">
                        <span className="truncate">{index + 1}. {set.category} · {set.amount} {set.unit}{set.weightKg !== undefined ? ` · ${set.weightKg} kg` : ""}</span>
                        <span className="shrink-0 tabular-nums">{formatTime(set.timeSeconds)} · rest {formatTime(set.restSeconds)}</span>
                      </li>
                    ))}
                  </ol>
                  <button
                    type="button"
                    onClick={() => startPlannedWorkout(plan)}
                    className="w-full rounded-lg bg-[#f16b84] px-3 py-2.5 text-xs font-semibold text-[#290f18] transition hover:bg-[#ff91a5]"
                  >
                    Start plan
                  </button>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}

      {showAbortConfirmation && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/25 px-3 pb-[max(100px,calc(env(safe-area-inset-bottom)+100px))] backdrop-blur-[2px] sm:items-center sm:pb-3">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="abort-workout-title"
            aria-describedby="abort-workout-description"
            className="workout-sheet w-full max-w-[380px] rounded-[1.7rem] border border-white/10 bg-[#27272b] p-5 shadow-[0_20px_60px_rgba(27,42,54,0.22)]"
          >
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-rose-500">Discard session</p>
            <h2 id="abort-workout-title" className="mt-1 text-lg font-semibold text-[#f3f2f4]">Are you sure?</h2>
            <p id="abort-workout-description" className="mt-2 text-sm leading-relaxed text-[#b8b3ba]">
              {pendingFlow ? "Your current workout will be discarded before starting the selected option." : "Your workout and its sets will be discarded."}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAbortConfirmation(false);
                  setPendingFlow(null);
                }}
                className="rounded-xl bg-[#303034] px-3 py-3 text-sm font-semibold text-[#cbc7cd] hover:bg-[#404045]"
              >
                Keep workout
              </button>
              <button
                type="button"
                onClick={abortWorkout}
                className="rounded-xl bg-rose-600 px-3 py-3 text-sm font-semibold text-white hover:bg-rose-700"
              >
                Yes, abort
              </button>
            </div>
          </section>
        </div>
      )}

      {mode === "workout" && (
        <section
          aria-label="Add workout set"
          className="fixed left-1/2 z-40 w-[calc(100%-16px)] max-w-[620px] -translate-x-1/2 rounded-[1.35rem] border border-white/10 bg-[#1c1c1f] p-3 shadow-[0_12px_36px_rgba(35,51,65,0.18)] backdrop-blur-xl"
          style={{ bottom: "calc(max(12px, env(safe-area-inset-bottom)) + 90px)" }}
        >
          <label className="mb-2 block">
            <span className="sr-only">Training category</span>
            <span className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#27272b] px-3">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4 shrink-0 text-[#aaa5ad]" aria-hidden="true">
                <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
              </svg>
              <select
                aria-label="Training category"
                value={category}
                onChange={(event) => changeCategory(event.target.value)}
                className="w-full min-w-0 appearance-none bg-transparent text-xs font-semibold text-[#e2e0e3] outline-none"
              >
                {WORKOUT_CATEGORIES.map((option) => <option key={option}>{option}</option>)}
              </select>
            </span>
          </label>
          <div className={`grid items-end gap-1.5 ${
            requiresWeight(category)
              ? "grid-cols-[repeat(4,minmax(0,1fr))_40px]"
              : "grid-cols-[repeat(3,minmax(0,1fr))_40px]"
          }`}>
            <label className="min-w-0">
              <span className="mb-1 block text-[8px] font-bold uppercase tracking-wide text-[#aaa5ad]">{getWorkoutSetUnit(category) === "m" ? "Distance · m" : "Reps"}</span>
              <input
                type="number"
                inputMode="decimal"
                min="0.1"
                step={getWorkoutSetUnit(category) === "reps" ? "1" : "0.1"}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                aria-label={getWorkoutSetUnit(category) === "m" ? "Distance in meters" : "Reps"}
                className="h-10 w-full rounded-lg border border-white/10 bg-[#27272b] px-2 text-xs font-semibold text-[#e2e0e3] outline-none focus:border-[#91576a]"
              />
            </label>
            {requiresWeight(category) && (
              <label className="min-w-0">
                <span className="mb-1 block text-[8px] font-bold uppercase tracking-wide text-[#aaa5ad]">
                  {category === "Farmer carries"
                    ? "Weight · kg / kettlebell"
                    : "Weight · kg"}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0.1"
                  step="0.1"
                  value={weight}
                  onChange={(event) => setWeight(event.target.value)}
                  aria-label={
                    category === "Farmer carries"
                      ? "Weight in kilograms per kettlebell"
                      : "Weight in kilograms"
                  }
                  className="h-10 w-full rounded-lg border border-white/10 bg-[#27272b] px-2 text-xs font-semibold text-[#e2e0e3] outline-none focus:border-[#91576a]"
                />
              </label>
            )}
            <label className="min-w-0">
              <span className="mb-1 block text-[8px] font-bold uppercase tracking-wide text-[#aaa5ad]">Time</span>
              <TimeInput
                label="Set time"
                value={time}
                onChange={setTime}
              />
            </label>
            <label className="min-w-0">
              <span className="mb-1 block text-[8px] font-bold uppercase tracking-wide text-[#aaa5ad]">Rest</span>
              <TimeInput
                label="Rest time"
                value={restTime}
                onChange={setRestTime}
              />
            </label>
            <button
              type="button"
              onClick={addSet}
              aria-label="Add set"
              className="flex h-10 w-10 items-center justify-center self-end rounded-full bg-[#f16b84] text-[#290f18] shadow-sm transition hover:scale-105 hover:bg-[#ff91a5]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
        </section>
      )}
      <Navbar />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#27272b] px-3 py-3">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-[#aaa5ad]">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-[#f3f2f4]">{value}</p>
    </div>
  );
}
