"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getWorkoutSetUnit,
  requiresWeight,
  requiresWeightAndDistance,
  WORKOUT_CATEGORIES,
} from "@/lib/types";
import type {
  WorkoutRecord,
  WorkoutSet,
  WorkoutSetUnit,
} from "@/lib/types";

interface WorkoutDraftSet {
  id: string;
  category: string;
  amount: string;
  unit: WorkoutSetUnit;
  weightKg: string;
  time: string;
  restTime: string;
  completed: boolean;
}

interface WorkoutDraft {
  name: string;
  date: string;
  source: WorkoutRecord["source"];
  sets: WorkoutDraftSet[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isWorkoutSetUnit(value: string): value is WorkoutSetUnit {
  return value === "m" || value === "kg" || value === "reps";
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isWorkoutSet(value: unknown): value is WorkoutSet {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.category === "string" &&
    typeof value.amount === "number" &&
    Number.isFinite(value.amount) &&
    (value.unit === "m" || value.unit === "kg" || value.unit === "reps") &&
    (value.weightKg === undefined ||
      (typeof value.weightKg === "number" && Number.isFinite(value.weightKg))) &&
    typeof value.timeSeconds === "number" &&
    Number.isInteger(value.timeSeconds) &&
    typeof value.restSeconds === "number" &&
    Number.isInteger(value.restSeconds) &&
    typeof value.completed === "boolean"
  );
}

function isWorkoutRecord(value: unknown): value is WorkoutRecord {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.name === "string" &&
    typeof value.date === "string" &&
    (value.source === "own" || value.source === "plan") &&
    Array.isArray(value.sets) &&
    value.sets.every(isWorkoutSet) &&
    typeof value.created_at === "string"
  );
}

function formatTime(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function parseTime(value: string): number | null {
  const match = /^(\d{1,3}):([0-5]\d)$/.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function toDraft(workout: WorkoutRecord): WorkoutDraft {
  return {
    name: workout.name,
    date: workout.date,
    source: workout.source,
    sets: workout.sets.map((set) => ({
      id: set.id,
      category: set.category,
      amount: String(set.amount),
      unit: set.unit,
      weightKg: set.weightKg === undefined ? "" : String(set.weightKg),
      time: formatTime(set.timeSeconds),
      restTime: formatTime(set.restSeconds),
      completed: set.completed,
    })),
  };
}

function parseDraft(
  draft: WorkoutDraft
):
  | { value: { name: string; date: string; source: WorkoutRecord["source"]; sets: WorkoutSet[] } }
  | { error: string } {
  const name = draft.name.trim();
  if (!name || name.length > 120 || !isValidDate(draft.date)) {
    return { error: "Enter a workout name and valid date." };
  }
  if (draft.sets.length === 0 || draft.sets.length > 100) {
    return { error: "A workout needs between 1 and 100 sets." };
  }

  const sets: WorkoutSet[] = [];
  for (const [index, set] of draft.sets.entries()) {
    const amount = Number(set.amount);
    const timeSeconds = parseTime(set.time);
    const restSeconds = parseTime(set.restTime);
    const weightKg = set.weightKg.trim() ? Number(set.weightKg) : undefined;

    if (
      !set.category.trim() ||
      set.category.length > 60 ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > 100000 ||
      (set.unit === "reps" && !Number.isInteger(amount))
    ) {
      return { error: `Check the exercise and amount for set ${index + 1}.` };
    }
    if (
      (weightKg !== undefined &&
        (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 100000)) ||
      (requiresWeight(set.category) && weightKg === undefined) ||
      (requiresWeightAndDistance(set.category) &&
        set.unit !== "m")
    ) {
      return { error: `Enter a valid weight for set ${index + 1}.` };
    }
    if (
      timeSeconds === null ||
      restSeconds === null ||
      timeSeconds > 86400 ||
      restSeconds > 86400
    ) {
      return { error: `Enter valid time and rest in set ${index + 1}.` };
    }

    sets.push({
      id: set.id,
      category: set.category,
      amount,
      unit: set.unit,
      ...(weightKg === undefined ? {} : { weightKg }),
      timeSeconds,
      restSeconds,
      completed: true,
    });
  }

  return { value: { name, date: draft.date, source: draft.source, sets } };
}

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [minutes = "00", seconds = "00"] = value.split(":");
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-medium text-[#b8b3ba]">{label}</span>
      <span className="flex h-10 items-center rounded-lg border border-white/10 bg-[#27272b] px-2">
        <input
          aria-label={`${label} minutes`}
          inputMode="numeric"
          maxLength={3}
          value={minutes}
          onChange={(event) =>
            onChange(`${event.target.value.replace(/\D/g, "").slice(0, 3)}:${seconds}`)
          }
          className="w-1/2 min-w-0 bg-transparent text-center text-sm tabular-nums text-[#f3f2f4] outline-none"
        />
        <span aria-hidden="true" className="text-sm text-[#aaa5ad]">:</span>
        <input
          aria-label={`${label} seconds`}
          inputMode="numeric"
          maxLength={2}
          value={seconds}
          onChange={(event) =>
            onChange(`${minutes}:${event.target.value.replace(/\D/g, "").slice(0, 2)}`)
          }
          className="w-1/2 min-w-0 bg-transparent text-center text-sm tabular-nums text-[#f3f2f4] outline-none"
        />
      </span>
    </label>
  );
}

export default function WorkoutHistoryManager() {
  const [workouts, setWorkouts] = useState<WorkoutRecord[] | null>(null);
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<WorkoutDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadWorkouts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/workouts", { cache: "no-store" });
      const payload: unknown = await response.json();
      if (!response.ok || !Array.isArray(payload) || !payload.every(isWorkoutRecord)) {
        throw new Error("Could not load logged workouts.");
      }
      setWorkouts(payload);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load logged workouts.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkouts();
  }, [loadWorkouts]);

  const updateDraft = (changes: Partial<Pick<WorkoutDraft, "name" | "date">>) => {
    setDraft((current) => current ? { ...current, ...changes } : current);
  };

  const updateDraftSet = (id: string, changes: Partial<WorkoutDraftSet>) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            sets: current.sets.map((set) => set.id === id ? { ...set, ...changes } : set),
          }
        : current
    );
  };

  const saveWorkout = async (id: number) => {
    if (!draft) return;
    const parsed = parseDraft(draft);
    if ("error" in parsed) {
      setError(parsed.error);
      return;
    }

    setBusyId(id);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/workouts?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.value),
      });
      const payload: unknown = await response.json();
      if (!response.ok || !isWorkoutRecord(payload)) {
        throw new Error(
          isRecord(payload) && typeof payload.error === "string"
            ? payload.error
            : "Could not update workout."
        );
      }

      setWorkouts((current) =>
        current
          ?.map((workout) => workout.id === id ? payload : workout)
          .sort((left, right) => right.date.localeCompare(left.date))
          ?? [payload]
      );
      setEditingId(null);
      setDraft(null);
      setPreviewId(id);
      setNotice("Workout updated.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not update workout.");
    } finally {
      setBusyId(null);
    }
  };

  const removeWorkout = async (id: number) => {
    if (!window.confirm("Delete this workout? This cannot be undone.")) return;
    setBusyId(id);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/workouts?id=${id}`, { method: "DELETE" });
      const payload: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          isRecord(payload) && typeof payload.error === "string"
            ? payload.error
            : "Could not delete workout."
        );
      }

      setWorkouts((current) => current?.filter((workout) => workout.id !== id) ?? []);
      if (previewId === id) setPreviewId(null);
      if (editingId === id) {
        setEditingId(null);
        setDraft(null);
      }
      setNotice("Workout deleted.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete workout.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section
      aria-labelledby="workout-history-heading"
      className="mb-5 rounded-[1.7rem] border border-white/10 bg-[#1c1c1f] p-5 shadow-sm sm:p-7"
    >
      <div className="mb-5">
        <h2 id="workout-history-heading" className="text-lg font-semibold text-[#f3f2f4]">
          Logged workouts
        </h2>
        <p className="mt-1 text-sm text-[#b8b3ba]">
          Preview, edit, or delete saved training sessions.
        </p>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-[#714342] bg-[#3d2425] px-3 py-2 text-sm text-[#ffa8a4]">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mb-4 rounded-lg border border-[#36594a] bg-[#1d3028] px-3 py-2 text-sm text-[#8ed9b1]">
          {notice}
        </p>
      )}
      {isLoading && <p role="status" className="py-4 text-sm text-[#aaa5ad]">Loading workouts...</p>}
      {!isLoading && workouts?.length === 0 && (
        <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-[#aaa5ad]">
          No workouts logged yet.
        </p>
      )}

      <div className="space-y-3">
        {workouts?.map((workout) => {
          const isEditing = editingId === workout.id && draft !== null;
          const isPreviewing = previewId === workout.id && !isEditing;
          const isBusy = busyId === workout.id;

          return (
            <article key={workout.id} className="rounded-xl border border-white/10 bg-[#242427] p-3 sm:p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-[#f3f2f4]">{workout.name}</h3>
                  <p className="mt-1 text-xs text-[#b8b3ba]">
                    {new Date(`${workout.date}T12:00:00`).toLocaleDateString("en", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    {" · "}
                    {workout.source === "plan" ? "Planned workout" : "Own workout"}
                    {" · "}
                    {workout.sets.length} {workout.sets.length === 1 ? "set" : "sets"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setDraft(null);
                      setPreviewId(isPreviewing ? null : workout.id);
                      setError("");
                    }}
                    className="rounded-lg border border-white/10 bg-[#27272b] px-2.5 py-1.5 text-xs font-medium text-[#cbc7cd] hover:bg-[#303034]"
                  >
                    {isPreviewing ? "Close" : "Preview"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewId(null);
                      setEditingId(workout.id);
                      setDraft(toDraft(workout));
                      setError("");
                    }}
                    className="rounded-lg border border-[#67414e] bg-[#30282d] px-2.5 py-1.5 text-xs font-semibold text-[#ffb0bd] hover:bg-[#41343b]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeWorkout(workout.id)}
                    disabled={isBusy}
                    className="rounded-lg border border-[#714342] bg-[#3d2425] px-2.5 py-1.5 text-xs font-semibold text-[#ffaaa5] hover:bg-[#4a292a] disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {isPreviewing && (
                <ol aria-label={`${workout.name} sets`} className="mt-4 space-y-2 border-t border-white/10 pt-3">
                  {workout.sets.map((set, index) => (
                    <li key={set.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
                      <span className="font-medium text-[#e2e0e3]">{index + 1}. {set.category}</span>
                      <span className="text-right text-[#b8b3ba]">
                        {set.amount} {set.unit}
                        {set.weightKg !== undefined
                          ? ` · ${set.weightKg} kg${set.category === "Farmer carries" ? " / kettlebell" : ""}`
                          : ""}
                        {" · "}
                        {formatTime(set.timeSeconds)} time
                        {" · "}
                        {formatTime(set.restSeconds)} rest
                      </span>
                    </li>
                  ))}
                </ol>
              )}

              {isEditing && draft && (
                <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-[#cbc7cd]">Workout name</span>
                      <input
                        value={draft.name}
                        onChange={(event) => updateDraft({ name: event.target.value })}
                        maxLength={120}
                        className="h-10 w-full rounded-lg border border-white/10 bg-[#27272b] px-3 text-sm text-[#f3f2f4] outline-none focus:border-[#91576a]"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-[#cbc7cd]">Date</span>
                      <input
                        type="date"
                        value={draft.date}
                        onChange={(event) => updateDraft({ date: event.target.value })}
                        className="h-10 w-full rounded-lg border border-white/10 bg-[#27272b] px-3 text-sm text-[#f3f2f4] outline-none focus:border-[#91576a]"
                      />
                    </label>
                  </div>

                  <div className="space-y-3">
                    {draft.sets.map((set, index) => (
                      <div key={set.id} className="rounded-xl border border-white/10 bg-[#27272b] p-3">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#e2e0e3]">Set {index + 1}</span>
                          <button
                            type="button"
                            onClick={() => setDraft((current) => current
                              ? { ...current, sets: current.sets.filter((item) => item.id !== set.id) }
                              : current)}
                            className="text-xs font-medium text-[#ffaaa5] hover:text-[#ffa8a4]"
                          >
                            Remove set
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <label className="col-span-2 block sm:col-span-2">
                            <span className="mb-1 block text-[10px] font-medium text-[#b8b3ba]">Exercise</span>
                            <select
                              value={set.category}
                              onChange={(event) => updateDraftSet(set.id, {
                                category: event.target.value,
                                unit: getWorkoutSetUnit(event.target.value),
                                amount: event.target.value === "Farmer carries"
                                  ? "200"
                                  : event.target.value === "Wall balls"
                                    ? "100"
                                  : getWorkoutSetUnit(event.target.value) === "m" ? "500" : "20",
                                weightKg: requiresWeight(event.target.value)
                                  ? event.target.value === "Farmer carries"
                                    ? "16"
                                    : event.target.value === "Wall balls"
                                      ? "4"
                                      : set.weightKg || "50"
                                  : "",
                              })}
                              className="h-10 w-full rounded-lg border border-white/10 bg-[#27272b] px-2 text-xs text-[#f3f2f4] outline-none focus:border-[#91576a]"
                            >
                              {!WORKOUT_CATEGORIES.some((category) => category === set.category) && (
                                <option value={set.category}>{set.category}</option>
                              )}
                              {WORKOUT_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
                            </select>
                          </label>
                          <label className="block">
                            <span className="mb-1 block text-[10px] font-medium text-[#b8b3ba]">Amount</span>
                            <input
                              type="number"
                              min="0"
                              step={set.unit === "reps" ? "1" : "0.1"}
                              value={set.amount}
                              onChange={(event) => updateDraftSet(set.id, { amount: event.target.value })}
                              className="h-10 w-full rounded-lg border border-white/10 bg-[#27272b] px-2 text-xs text-[#f3f2f4] outline-none focus:border-[#91576a]"
                            />
                          </label>
                          <label className="block">
                            <span className="mb-1 block text-[10px] font-medium text-[#b8b3ba]">Unit</span>
                            <select
                              value={set.unit}
                              onChange={(event) => {
                                if (isWorkoutSetUnit(event.target.value)) {
                                  updateDraftSet(set.id, { unit: event.target.value });
                                }
                              }}
                              className="h-10 w-full rounded-lg border border-white/10 bg-[#27272b] px-2 text-xs text-[#f3f2f4] outline-none focus:border-[#91576a]"
                            >
                              <option value="m">Meters</option>
                              <option value="kg">Kilograms</option>
                              <option value="reps">Reps</option>
                            </select>
                          </label>
                          <TimeField
                            label="Time"
                            value={set.time}
                            onChange={(time) => updateDraftSet(set.id, { time })}
                          />
                          <TimeField
                            label="Rest"
                            value={set.restTime}
                            onChange={(restTime) => updateDraftSet(set.id, { restTime })}
                          />
                          <label className="block">
                            <span className="mb-1 block text-[10px] font-medium text-[#b8b3ba]">
                              {set.category === "Farmer carries"
                                ? "Weight · kg / kettlebell"
                                : "Weight · kg"}
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={set.weightKg}
                              onChange={(event) => updateDraftSet(set.id, { weightKg: event.target.value })}
                              className="h-10 w-full rounded-lg border border-white/10 bg-[#27272b] px-2 text-xs text-[#f3f2f4] outline-none focus:border-[#91576a]"
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setDraft((current) => current
                        ? {
                            ...current,
                            sets: [...current.sets, {
                              id: crypto.randomUUID(),
                              category: WORKOUT_CATEGORIES[0],
                              amount: "500",
                              unit: "m",
                              weightKg: "",
                              time: "00:00",
                              restTime: "00:00",
                              completed: true,
                            }],
                          }
                        : current)}
                      className="rounded-lg border border-dashed border-white/20 px-3 py-2 text-xs font-semibold text-[#cbc7cd] hover:border-[#91576a] hover:text-[#ffb0bd]"
                    >
                      Add set
                    </button>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setDraft(null);
                        setError("");
                      }}
                      className="rounded-lg border border-white/10 bg-[#27272b] px-3 py-2 text-xs font-semibold text-[#cbc7cd] hover:bg-[#303034]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void saveWorkout(workout.id)}
                      disabled={isBusy}
                      className="rounded-lg bg-[#f16b84] px-4 py-2 text-xs font-semibold text-[#290f18] hover:bg-[#ff91a5] disabled:opacity-50"
                    >
                      {isBusy ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
