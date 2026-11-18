"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import WorkoutStartSheet, { WorkoutFlow } from "@/components/WorkoutStartSheet";
import { getWorkoutSetUnit, requiresWeightAndDistance, WORKOUT_CATEGORIES } from "@/lib/types";
import type { WorkoutSet, WorkoutSetUnit, WorkoutSource } from "@/lib/types";

const samplePlan = [
  { category: "Running", amount: 500, unit: "m" as const, timeSeconds: 160, restSeconds: 60 },
  { category: "Running", amount: 500, unit: "m" as const, timeSeconds: 160, restSeconds: 60 },
  { category: "Running", amount: 500, unit: "m" as const, timeSeconds: 160, restSeconds: 60 },
  { category: "Running", amount: 500, unit: "m" as const, timeSeconds: 160, restSeconds: 60 },
];

type PageMode = "choose" | "plan" | "workout" | "finished";

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

interface TimeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function TimeInput({ label, value, onChange }: TimeInputProps) {
  const [minutes = "", seconds = ""] = value.split(":");

  return (
    <div
      role="group"
      aria-label={label}
      className="flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-[#f7f9fb] px-1 focus-within:border-[#9bb4c7]"
    >
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={3}
        value={minutes}
        onChange={(event) =>
          onChange(`${event.target.value.replace(/\D/g, "").slice(0, 3)}:${seconds}`)
        }
        aria-label={`${label} minutes`}
        className="min-w-0 w-1/2 bg-transparent text-center text-xs font-semibold tabular-nums text-slate-700 outline-none"
      />
      <span aria-hidden="true" className="text-xs font-semibold text-slate-500">:</span>
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
        className="min-w-0 w-1/2 bg-transparent text-center text-xs font-semibold tabular-nums text-slate-700 outline-none"
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
  inputMode?: "decimal" | "text";
  onSave: (value: string) => void;
}

function EditableValue({
  value,
  suffix,
  label,
  inputMode = "text",
  onSave,
}: EditableValueProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const save = () => {
    setEditing(false);
    onSave(draft.trim());
  };

  if (editing) {
    return (
      <input
        autoFocus
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
        className="w-[70px] rounded-lg border border-[#9bb4c7] bg-white px-2 py-1 text-right text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#dce8f0]"
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={`Edit ${label}`}
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      className="rounded-md px-1.5 py-1 text-sm font-semibold tabular-nums text-slate-700 transition hover:bg-slate-100 hover:text-[#426987]"
    >
      {value}{suffix ? <span className="ml-1 text-[10px] font-medium text-slate-400">{suffix}</span> : null}
    </button>
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
          total + (set.weightKg ?? (set.unit === "kg" ? set.amount : 0)),
        0
      ),
    [sets]
  );
  const totalReps = useMemo(
    () => sets.filter((set) => set.unit === "reps").reduce((total, set) => total + set.amount, 0),
    [sets]
  );

  const startOwnWorkout = useCallback(() => {
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

  const startPlannedWorkout = () => {
    setShowStartSheet(false);
    setSource("plan");
    setWorkoutName("HYROX running intervals");
    setNameDraft("HYROX running intervals");
    setDate(localDateValue());
    setSets(
      samplePlan.map((set) => ({
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
      requiresWeightAndDistance(category) &&
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
        ...(requiresWeightAndDistance(category) ? { weightKg: numericWeight } : {}),
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
      setMode("finished");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save your workout.");
    } finally {
      setIsSaving(false);
    }
  };

  const resetWorkout = () => {
    setSets([]);
    setError("");
    setPendingFlow(null);
    setShowStartSheet(true);
    setMode("choose");
  };

  const changeCategory = (nextCategory: string) => {
    setCategory(nextCategory);
    setAmount(getWorkoutSetUnit(nextCategory) === "m" ? "500" : "20");
    setWeight("50");
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

  return (
    <main className={`min-h-screen px-3 pt-5 sm:px-5 sm:pt-8 ${mode === "workout" ? "pb-[310px]" : "pb-28"}`}>
      <div className="mx-auto max-w-[680px]">
        <header className="mb-5 flex items-start justify-between gap-3 px-1">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9ab0c4]">HYROX · TRAINING LOG</p>
            <h1 className="mt-1 text-[25px] font-semibold tracking-[-0.04em] text-[#edf3f8] sm:text-[28px]">
              {mode === "finished" ? "Workout complete" : "Log workout"}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
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
                className="flex flex-col items-center gap-1 text-[10px] font-semibold text-slate-600 disabled:opacity-40"
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
                className="rounded-full px-2 py-1 text-[10px] font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-40"
              >
                Abort workout
              </button>
            </div>
          )}
        </header>

        {error && (
          <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {mode === "choose" && (
          <div className="rounded-[1.8rem] border border-white/80 bg-white/60 p-5 text-sm text-slate-500">
            Choose a workout option to get started.
          </div>
        )}

        {mode === "plan" && (
          <div className="rounded-[1.8rem] border border-white/80 bg-white/60 p-5 text-sm text-slate-500">
            Review today&apos;s sample plan, then import its sets to begin.
          </div>
        )}

        {mode === "workout" && (
          <div className="space-y-4">
            <section className="rounded-[1.8rem] border border-white/85 bg-white/85 p-5 shadow-[0_12px_30px_rgba(47,68,85,0.06)] sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#66839a]">WORKOUT NAME · TAP TO EDIT</p>
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
                      className="mt-1 w-full border-b border-[#9bb4c7] bg-transparent py-1 text-lg font-semibold text-slate-800 outline-none"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setNameDraft(workoutName);
                        setIsEditingName(true);
                      }}
                      className="mt-1 flex max-w-full items-center gap-2 text-left text-lg font-semibold tracking-tight text-slate-800"
                    >
                      <span className="truncate">{workoutName}</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true">
                        <path d="m15 5 4 4M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4Z" />
                      </svg>
                    </button>
                  )}
                </div>
                {source === "plan" && <span className="rounded-full bg-[#edf3f7] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-[#527b9f]">Planned</span>}
              </div>
              <label className="mt-4 block text-[10px] font-semibold uppercase tracking-wide text-slate-400" htmlFor="workout-date">Day</label>
              <input
                id="workout-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="mt-1 rounded-lg border border-slate-100 bg-[#f7f9fb] px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-[#9bb4c7]"
              />
            </section>

            <section className="rounded-[1.8rem] border border-white/85 bg-white/85 p-5 shadow-[0_12px_30px_rgba(47,68,85,0.06)] sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-800">Added sets</h2>
                <span className="rounded-full bg-[#edf3f7] px-2.5 py-1 text-[10px] font-semibold text-slate-500">{sets.length} {sets.length === 1 ? "set" : "sets"}</span>
              </div>
              {sets.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-[#f9fbfc] px-4 py-6 text-center text-xs text-slate-400">
                  No sets yet. Add your first set below.
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedSets).map(([groupCategory, categorySets]) => (
                    <section key={groupCategory} aria-label={`${groupCategory} sets`}>
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-xs font-semibold text-slate-600">{groupCategory}</h3>
                        <span className="text-[10px] text-slate-400">{categorySets.length} {categorySets.length === 1 ? "set" : "sets"}</span>
                      </div>
                      <ol className="space-y-2">
                        {categorySets.map((set, index) => (
                          <li key={set.id} className={`grid grid-cols-[36px_minmax(0,1fr)] items-center gap-x-2 gap-y-1 rounded-xl border px-2 py-2 transition ${set.completed ? "border-emerald-100 bg-emerald-50/60" : "border-slate-100 bg-white"}`}>
                            <button
                              type="button"
                              aria-label={`${set.completed ? "Reopen" : "Complete"} set ${index + 1}`}
                              aria-pressed={set.completed}
                              onClick={() => updateSet(set.id, { completed: !set.completed })}
                              className={`row-span-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition ${
                                set.completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-emerald-400"
                              }`}
                            >
                              {set.completed ? <CheckIcon /> : index + 1}
                            </button>
                            <span className="min-w-0">
                              <span className={`block text-[9px] ${set.completed ? "text-emerald-700" : "text-slate-400"}`}>{set.completed ? "Completed" : `Set ${index + 1}`}</span>
                            </span>
                            <div className="flex min-w-0 flex-wrap items-center gap-1">
                              <EditableValue
                                label={`set ${index + 1} ${set.unit}`}
                                value={String(set.amount)}
                                suffix={set.unit}
                                inputMode="decimal"
                                onSave={(value) => updateSetAmount(set, value)}
                              />
                              {set.weightKg !== undefined && (
                                <EditableValue
                                  label={`set ${index + 1} weight`}
                                  value={String(set.weightKg)}
                                  suffix="kg"
                                  inputMode="decimal"
                                  onSave={(value) => updateSetWeight(set, value)}
                                />
                              )}
                              <EditableValue
                                label={`set ${index + 1} time`}
                                value={formatTime(set.timeSeconds)}
                                onSave={(value) => updateSetTime(set, value)}
                              />
                              <EditableValue
                                label={`set ${index + 1} rest time`}
                                value={formatTime(set.restSeconds)}
                                onSave={(value) => updateSetRest(set, value)}
                              />
                            </div>
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
          <section className="rounded-[1.8rem] border border-white/85 bg-white/85 p-5 shadow-[0_12px_30px_rgba(47,68,85,0.06)] sm:p-7">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white">
                <CheckIcon className="h-6 w-6" />
              </span>
              <div>
                <h2 className="font-semibold text-slate-800">{workoutName}</h2>
                <p className="text-xs text-slate-500">{new Date(`${date}T12:00:00`).toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" })} · saved to training log</p>
              </div>
            </div>
            <div className="mb-5 rounded-2xl bg-emerald-50 p-4">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-emerald-800">
                <span>Workout progress</span>
                <span>100%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-emerald-100">
                <div className="h-full w-full rounded-full bg-emerald-500" />
              </div>
              <p className="mt-2 text-[10px] text-emerald-700">All {sets.length} {sets.length === 1 ? "set" : "sets"} marked complete.</p>
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
              className="mt-6 w-full rounded-xl bg-[#273744] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#354c5d]"
            >
              Back to dashboard
            </button>
            <button type="button" onClick={resetWorkout} className="mt-3 w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800">
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
            aria-label="Close planned workout"
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
            className="workout-sheet absolute left-1/2 w-[calc(100%-24px)] max-w-[420px] -translate-x-1/2 rounded-[1.7rem] border border-white/80 bg-white/95 p-5 shadow-[0_20px_60px_rgba(27,42,54,0.22)]"
            style={{ bottom: "calc(max(12px, env(safe-area-inset-bottom)) + 88px)" }}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#66839a]">SAMPLE PLAN · SETTINGS COMING LATER</p>
                <h2 id="planned-workout-title" className="mt-1 text-lg font-semibold text-slate-800">HYROX running intervals</h2>
                <p className="mt-1 text-xs text-slate-500">The plan&apos;s sets will be added to your workout.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMode("choose");
                  setShowStartSheet(true);
                }}
                aria-label="Back to workout options"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                ×
              </button>
            </div>
            <div className="mb-4 space-y-2">
              {samplePlan.map((set, index) => (
                <div key={index} className="flex items-center justify-between rounded-xl bg-[#f7f9fb] px-3 py-2.5 text-xs">
                  <span className="font-medium text-slate-600">Run · Set {index + 1}</span>
                  <span className="font-semibold tabular-nums text-slate-800">{set.amount} m · {formatTime(set.timeSeconds)} <span className="font-medium text-slate-500">rest {formatTime(set.restSeconds)}</span></span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={startPlannedWorkout}
              className="w-full rounded-xl bg-[#273744] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#354c5d]"
            >
              Start plan · import {samplePlan.length} sets
            </button>
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
            className="workout-sheet w-full max-w-[380px] rounded-[1.7rem] border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(27,42,54,0.22)]"
          >
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-rose-500">Discard session</p>
            <h2 id="abort-workout-title" className="mt-1 text-lg font-semibold text-slate-800">Are you sure?</h2>
            <p id="abort-workout-description" className="mt-2 text-sm leading-relaxed text-slate-500">
              {pendingFlow ? "Your current workout will be discarded before starting the selected option." : "Your workout and its sets will be discarded."}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAbortConfirmation(false);
                  setPendingFlow(null);
                }}
                className="rounded-xl bg-slate-100 px-3 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-200"
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
          className="fixed left-1/2 z-40 w-[calc(100%-16px)] max-w-[620px] -translate-x-1/2 rounded-[1.35rem] border border-white/90 bg-white/95 p-3 shadow-[0_12px_36px_rgba(35,51,65,0.18)] backdrop-blur-xl"
          style={{ bottom: "calc(max(12px, env(safe-area-inset-bottom)) + 90px)" }}
        >
          <label className="mb-2 block">
            <span className="sr-only">Training category</span>
            <span className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-[#f7f9fb] px-3">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true">
                <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
              </svg>
              <select
                aria-label="Training category"
                value={category}
                onChange={(event) => changeCategory(event.target.value)}
                className="w-full min-w-0 appearance-none bg-transparent text-xs font-semibold text-slate-700 outline-none"
              >
                {WORKOUT_CATEGORIES.map((option) => <option key={option}>{option}</option>)}
              </select>
            </span>
          </label>
          <div className={`grid items-end gap-1.5 ${
            requiresWeightAndDistance(category)
              ? "grid-cols-[repeat(4,minmax(0,1fr))_40px]"
              : "grid-cols-[repeat(3,minmax(0,1fr))_40px]"
          }`}>
            <label className="min-w-0">
              <span className="mb-1 block text-[8px] font-bold uppercase tracking-wide text-slate-400">{getWorkoutSetUnit(category) === "m" ? "Distance · m" : "Reps"}</span>
              <input
                type="number"
                inputMode="decimal"
                min="0.1"
                step={getWorkoutSetUnit(category) === "reps" ? "1" : "0.1"}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                aria-label={getWorkoutSetUnit(category) === "m" ? "Distance in meters" : "Reps"}
                className="h-10 w-full rounded-lg border border-slate-200 bg-[#f7f9fb] px-2 text-xs font-semibold text-slate-700 outline-none focus:border-[#9bb4c7]"
              />
            </label>
            {requiresWeightAndDistance(category) && (
              <label className="min-w-0">
                <span className="mb-1 block text-[8px] font-bold uppercase tracking-wide text-slate-400">Weight · kg</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0.1"
                  step="0.1"
                  value={weight}
                  onChange={(event) => setWeight(event.target.value)}
                  aria-label="Weight in kilograms"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-[#f7f9fb] px-2 text-xs font-semibold text-slate-700 outline-none focus:border-[#9bb4c7]"
                />
              </label>
            )}
            <label className="min-w-0">
              <span className="mb-1 block text-[8px] font-bold uppercase tracking-wide text-slate-400">Time</span>
              <TimeInput
                label="Set time"
                value={time}
                onChange={setTime}
              />
            </label>
            <label className="min-w-0">
              <span className="mb-1 block text-[8px] font-bold uppercase tracking-wide text-slate-400">Rest</span>
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
              className="flex h-10 w-10 items-center justify-center self-end rounded-full bg-[#273744] text-white shadow-sm transition hover:scale-105 hover:bg-[#354c5d]"
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
    <div className="rounded-xl bg-[#f4f7f9] px-3 py-3">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-slate-800">{value}</p>
    </div>
  );
}
