"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getWorkoutSetUnit,
  requiresWeight,
  requiresWeightAndDistance,
  WORKOUT_CATEGORIES,
} from "@/lib/types";
import type { WorkoutPlan, WorkoutSet, WorkoutSetUnit } from "@/lib/types";

interface SetDraft {
  category: string;
  amount: string;
  weight: string;
  time: string;
  rest: string;
}

function emptySetDraft(category: string = WORKOUT_CATEGORIES[0]): SetDraft {
  return {
    category,
    amount: category === "Farmer carries" ? "200" : category === "Wall balls" ? "100" : "500",
    weight: category === "Farmer carries" ? "16" : category === "Wall balls" ? "4" : "50",
    time: "02:40",
    rest: "01:00",
  };
}

function parseTime(value: string): number | null {
  const match = /^(\d{1,3}):([0-5]\d)$/.exec(value.trim());
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

function formatTime(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isWorkoutSetUnit(value: unknown): value is WorkoutSetUnit {
  return value === "m" || value === "kg" || value === "reps";
}

function isWorkoutSet(value: unknown): value is WorkoutSet {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.category === "string" &&
    typeof value.amount === "number" &&
    Number.isFinite(value.amount) &&
    isWorkoutSetUnit(value.unit) &&
    (value.weightKg === undefined ||
      (typeof value.weightKg === "number" && Number.isFinite(value.weightKg))) &&
    typeof value.timeSeconds === "number" &&
    Number.isInteger(value.timeSeconds) &&
    typeof value.restSeconds === "number" &&
    Number.isInteger(value.restSeconds) &&
    typeof value.completed === "boolean"
  );
}

function isWorkoutPlan(value: unknown): value is WorkoutPlan {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.name === "string" &&
    Array.isArray(value.sets) &&
    value.sets.every(isWorkoutSet) &&
    typeof value.created_at === "string" &&
    typeof value.updated_at === "string"
  );
}

function getErrorMessage(payload: unknown, fallback: string): string {
  return isRecord(payload) && typeof payload.error === "string" ? payload.error : fallback;
}

function SetTimeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [minutes = "", seconds = ""] = value.split(":");
  return (
    <label className="min-w-0">
      <span className="mb-1 block text-[8px] font-bold uppercase tracking-wide text-slate-400">{label}</span>
      <span className="flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-[#f7f9fb] px-1 focus-within:border-[#9bb4c7]">
        <input
          type="text"
          inputMode="numeric"
          maxLength={3}
          aria-label={`${label} minutes`}
          value={minutes}
          onChange={(event) => onChange(`${event.target.value.replace(/\D/g, "").slice(0, 3)}:${seconds}`)}
          className="min-w-0 w-1/2 bg-transparent text-center text-xs font-semibold tabular-nums text-slate-700 outline-none"
        />
        <span aria-hidden="true" className="text-xs font-semibold text-slate-500">:</span>
        <input
          type="text"
          inputMode="numeric"
          maxLength={2}
          aria-label={`${label} seconds`}
          value={seconds}
          onChange={(event) => onChange(`${minutes}:${event.target.value.replace(/\D/g, "").slice(0, 2)}`)}
          className="min-w-0 w-1/2 bg-transparent text-center text-xs font-semibold tabular-nums text-slate-700 outline-none"
        />
      </span>
    </label>
  );
}

export default function WorkoutPlanBuilder() {
  const [plans, setPlans] = useState<WorkoutPlan[] | null>(null);
  const [name, setName] = useState("");
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [setDraft, setSetDraft] = useState<SetDraft>(() => emptySetDraft());
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadPlans = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/plans", { cache: "no-store" });
      const payload: unknown = await response.json();
      if (!response.ok || !Array.isArray(payload) || !payload.every(isWorkoutPlan)) {
        throw new Error(getErrorMessage(payload, "Could not load workout plans."));
      }
      setPlans(payload);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load workout plans.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  const resetEditor = () => {
    setEditingPlanId(null);
    setIsCreating(false);
    setName("");
    setSets([]);
    setSetDraft(emptySetDraft());
    setEditingSetId(null);
  };

  const changeCategory = (category: string) => {
    setSetDraft(emptySetDraft(category));
  };

  const saveSet = () => {
    setError("");
    const amount = Number(setDraft.amount);
    const weightKg = requiresWeight(setDraft.category) ? Number(setDraft.weight) : undefined;
    const timeSeconds = parseTime(setDraft.time);
    const restSeconds = parseTime(setDraft.rest);

    if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) {
      setError("Enter a valid set distance or rep count.");
      return;
    }
    if (getWorkoutSetUnit(setDraft.category) === "reps" && !Number.isInteger(amount)) {
      setError("Repetitions must be a whole number.");
      return;
    }
    if (weightKg !== undefined && (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 100000)) {
      setError("Enter a valid weight.");
      return;
    }
    if (
      requiresWeightAndDistance(setDraft.category) &&
      getWorkoutSetUnit(setDraft.category) !== "m"
    ) {
      setError("This exercise requires a distance.");
      return;
    }
    if (timeSeconds === null || restSeconds === null || timeSeconds > 86400 || restSeconds > 86400) {
      setError("Enter valid time and rest in minutes and seconds.");
      return;
    }

    const nextSet: WorkoutSet = {
      id: editingSetId ?? crypto.randomUUID(),
      category: setDraft.category,
      amount,
      unit: getWorkoutSetUnit(setDraft.category),
      ...(weightKg === undefined ? {} : { weightKg }),
      timeSeconds,
      restSeconds,
      completed: false,
    };
    setSets((current) =>
      editingSetId
        ? current.map((set) => set.id === editingSetId ? nextSet : set)
        : [...current, nextSet]
    );
    setEditingSetId(null);
    setSetDraft(emptySetDraft(setDraft.category));
  };

  const editSet = (set: WorkoutSet) => {
    setEditingSetId(set.id);
    setSetDraft({
      category: set.category,
      amount: String(set.amount),
      weight: set.weightKg === undefined ? "" : String(set.weightKg),
      time: formatTime(set.timeSeconds),
      rest: formatTime(set.restSeconds),
    });
  };

  const editPlan = (plan: WorkoutPlan) => {
    setEditingPlanId(plan.id);
    setIsCreating(false);
    setName(plan.name);
    setSets(plan.sets);
    setSetDraft(emptySetDraft());
    setEditingSetId(null);
    setError("");
    setNotice("");
  };

  const savePlan = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!name.trim() || name.trim().length > 120) {
      setError("Enter a plan name up to 120 characters.");
      return;
    }
    if (sets.length === 0) {
      setError("Add at least one set to the plan.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        editingPlanId ? `/api/plans?id=${editingPlanId}` : "/api/plans",
        {
          method: editingPlanId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), sets }),
        }
      );
      const payload: unknown = await response.json();
      if (!response.ok || !isWorkoutPlan(payload)) {
        throw new Error(getErrorMessage(payload, "Could not save workout plan."));
      }
      setPlans((current) =>
        [payload, ...(current ?? []).filter((plan) => plan.id !== payload.id)]
      );
      setNotice(editingPlanId ? "Plan updated." : "Plan saved.");
      resetEditor();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save workout plan.");
    } finally {
      setIsSaving(false);
    }
  };

  const removePlan = async (plan: WorkoutPlan) => {
    if (!window.confirm(`Delete "${plan.name}"? This cannot be undone.`)) return;
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/plans?id=${plan.id}`, { method: "DELETE" });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(getErrorMessage(payload, "Could not delete plan."));
      setPlans((current) => current?.filter((item) => item.id !== plan.id) ?? []);
      if (editingPlanId === plan.id) resetEditor();
      setNotice("Plan deleted.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete plan.");
    }
  };

  return (
    <section
      aria-labelledby="plan-builder-heading"
      className="mb-5 rounded-[1.7rem] border border-white/80 bg-white/80 p-5 shadow-sm sm:p-7"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="plan-builder-heading" className="text-lg font-semibold text-slate-800">Workout plans</h2>
          <p className="mt-1 text-sm text-slate-500">Build reusable sessions, then select them from Follow plan.</p>
        </div>
        {editingPlanId === null && !isCreating && plans !== null && plans.length > 0 && (
          <button
            type="button"
            onClick={() => {
              resetEditor();
              setIsCreating(true);
              setError("");
              setNotice("");
              document.getElementById("plan-name")?.focus();
            }}
            className="rounded-lg bg-[#273744] px-3 py-2 text-xs font-semibold text-white hover:bg-[#354c5d]"
          >
            New plan
          </button>
        )}
      </div>

      {error && <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}

      {(editingPlanId !== null || isCreating || plans?.length === 0) && (
        <form onSubmit={savePlan} className="mb-6 rounded-xl border border-slate-200 bg-[#f9fbfc] p-3 sm:p-4">
          <label htmlFor="plan-name" className="mb-3 block">
            <span className="mb-1 block text-xs font-medium text-slate-600">Plan name</span>
            <input
              id="plan-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={120}
              placeholder="e.g. HYROX race prep"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#9bb4c7]"
            />
          </label>

          <div className="mb-3 grid items-end gap-2 sm:grid-cols-2">
            <label>
              <span className="mb-1 block text-[10px] font-medium text-slate-500">Exercise</span>
              <select
                value={setDraft.category}
                onChange={(event) => changeCategory(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800 outline-none focus:border-[#9bb4c7]"
              >
                {WORKOUT_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-[10px] font-medium text-slate-500">
                {getWorkoutSetUnit(setDraft.category) === "m" ? "Distance · m" : "Reps"}
              </span>
              <input
                type="number"
                min="0.1"
                step={getWorkoutSetUnit(setDraft.category) === "reps" ? "1" : "0.1"}
                value={setDraft.amount}
                onChange={(event) => setSetDraft((current) => ({ ...current, amount: event.target.value }))}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800 outline-none focus:border-[#9bb4c7]"
              />
            </label>
          </div>

          <div className={`grid items-end gap-2 ${requiresWeight(setDraft.category) ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3"}`}>
            {requiresWeight(setDraft.category) && (
              <label>
                <span className="mb-1 block text-[10px] font-medium text-slate-500">
                  {setDraft.category === "Farmer carries" ? "Weight · kg / kettlebell" : "Weight · kg"}
                </span>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={setDraft.weight}
                  onChange={(event) => setSetDraft((current) => ({ ...current, weight: event.target.value }))}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800 outline-none focus:border-[#9bb4c7]"
                />
              </label>
            )}
            <SetTimeInput
              label="Time"
              value={setDraft.time}
              onChange={(time) => setSetDraft((current) => ({ ...current, time }))}
            />
            <SetTimeInput
              label="Rest"
              value={setDraft.rest}
              onChange={(rest) => setSetDraft((current) => ({ ...current, rest }))}
            />
            <button
              type="button"
              onClick={saveSet}
              className="h-10 rounded-lg border border-[#d8e4ec] bg-[#edf3f7] px-3 text-xs font-semibold text-[#426987] hover:bg-[#e3edf4]"
            >
              {editingSetId ? "Update set" : "Add set"}
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {sets.map((set, index) => (
              <div key={set.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                <span className="text-xs font-medium text-slate-700">
                  {index + 1}. {set.category} · {set.amount} {set.unit}
                  {set.weightKg !== undefined ? ` · ${set.weightKg} kg${set.category === "Farmer carries" ? " / kettlebell" : ""}` : ""}
                  {" · "}{formatTime(set.timeSeconds)} time · {formatTime(set.restSeconds)} rest
                </span>
                <span className="flex gap-2">
                  <button type="button" onClick={() => editSet(set)} className="text-xs font-semibold text-[#426987] hover:underline">Edit set</button>
                  <button
                    type="button"
                    onClick={() => {
                      setSets((current) => current.filter((item) => item.id !== set.id));
                      if (editingSetId === set.id) {
                        setEditingSetId(null);
                        setSetDraft(emptySetDraft());
                      }
                    }}
                    className="text-xs font-semibold text-rose-600 hover:underline"
                  >
                    Remove
                  </button>
                </span>
              </div>
            ))}
            {sets.length === 0 && <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-400">Add sets to your plan above.</p>}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            {editingPlanId !== null && (
              <button type="button" onClick={resetEditor} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
            )}
            <button type="submit" disabled={isSaving} className="rounded-lg bg-[#273744] px-4 py-2 text-xs font-semibold text-white hover:bg-[#354c5d] disabled:opacity-50">
              {isSaving ? "Saving..." : editingPlanId ? "Save changes" : "Save plan"}
            </button>
          </div>
        </form>
      )}

      {isLoading && <p role="status" className="py-4 text-sm text-slate-400">Loading plans...</p>}
      {!isLoading && plans?.length === 0 && editingPlanId === null && !isCreating && (
        <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
          No plans yet. Start building your first plan above.
        </p>
      )}
      <div className="space-y-3">
        {plans?.map((plan) => (
          <article key={plan.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-100 bg-[#f9fbfc] p-3 sm:p-4">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-800">{plan.name}</h3>
              <p className="mt-1 text-xs text-slate-500">{plan.sets.length} {plan.sets.length === 1 ? "set" : "sets"}</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                {plan.sets.map((set) => set.category).join(" · ")}
              </p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <button type="button" onClick={() => editPlan(plan)} className="rounded-lg border border-[#d8e4ec] bg-[#edf3f7] px-2.5 py-1.5 text-xs font-semibold text-[#426987] hover:bg-[#e3edf4]">
                Edit
              </button>
              <button type="button" onClick={() => void removePlan(plan)} className="rounded-lg border border-rose-100 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100">
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
