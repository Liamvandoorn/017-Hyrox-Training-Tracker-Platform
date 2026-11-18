import { NextRequest, NextResponse } from "next/server";
import { addWorkout, deleteWorkout, getWorkouts, updateWorkout } from "@/lib/db";
import { requiresWeight, requiresWeightAndDistance } from "@/lib/types";
import type { WorkoutSet, WorkoutSetUnit, WorkoutSource } from "@/lib/types";

export const dynamic = "force-dynamic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isWorkoutSetUnit(value: unknown): value is WorkoutSetUnit {
  return value === "m" || value === "kg" || value === "reps";
}

function isValidDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isWorkoutSet(value: unknown): value is WorkoutSet {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    value.id.length <= 100 &&
    typeof value.category === "string" &&
    value.category.trim().length > 0 &&
    value.category.length <= 60 &&
    typeof value.amount === "number" &&
    Number.isFinite(value.amount) &&
    value.amount > 0 &&
    value.amount <= 100000 &&
    (value.weightKg === undefined ||
      (typeof value.weightKg === "number" &&
        Number.isFinite(value.weightKg) &&
        value.weightKg > 0 &&
        value.weightKg <= 100000)) &&
    isWorkoutSetUnit(value.unit) &&
    (!requiresWeight(value.category) || typeof value.weightKg === "number") &&
    (!requiresWeightAndDistance(value.category) || value.unit === "m") &&
    (value.unit !== "reps" || Number.isInteger(value.amount)) &&
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

function validateWorkoutInput(
  body: unknown
):
  | { value: { name: string; date: string; source: WorkoutSource; sets: WorkoutSet[] } }
  | { error: string } {
  if (!isRecord(body)) {
    return { error: "Invalid workout data" };
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 120 || !isValidDate(body.date)) {
    return { error: "A workout name and valid date are required" };
  }
  if (body.source !== "own" && body.source !== "plan") {
    return { error: "Invalid workout source" };
  }
  if (!Array.isArray(body.sets) || body.sets.length === 0 || body.sets.length > 100) {
    return { error: "Add between 1 and 100 valid sets" };
  }

  const sets = body.sets.filter(isWorkoutSet);
  if (sets.length !== body.sets.length) {
    return { error: "Workout contains an invalid set" };
  }
  if (!sets.every((set) => set.completed)) {
    return { error: "All sets must be completed before saving" };
  }

  return {
    value: {
      name,
      date: body.date,
      source: body.source,
      sets,
    },
  };
}

function getWorkoutId(request: NextRequest): number | null {
  const value = new URL(request.url).searchParams.get("id");
  if (!value || !/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

function addLegacyRestTimeDefault(workout: unknown): unknown {
  if (!isRecord(workout) || !Array.isArray(workout.sets)) return workout;
  return {
    ...workout,
    sets: workout.sets.map((set) =>
      isRecord(set) && (set.restSeconds === undefined || set.restSeconds === null)
        ? { ...set, restSeconds: 0 }
        : set
    ),
  };
}

export async function GET() {
  try {
    const workouts = await getWorkouts();
    return NextResponse.json(workouts.map(addLegacyRestTimeDefault));
  } catch (error) {
    console.error("GET /api/workouts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch workouts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const validation = validateWorkoutInput(body);
  if ("error" in validation) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const workout = await addWorkout(
      validation.value.name,
      validation.value.date,
      validation.value.source,
      validation.value.sets
    );
    return NextResponse.json(workout, { status: 201 });
  } catch (error) {
    console.error("POST /api/workouts error:", error);
    return NextResponse.json(
      { error: "Failed to save workout" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const id = getWorkoutId(request);
  if (id === null) {
    return NextResponse.json({ error: "A valid workout ID is required" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const validation = validateWorkoutInput(body);
  if ("error" in validation) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const workout = await updateWorkout(
      id,
      validation.value.name,
      validation.value.date,
      validation.value.source,
      validation.value.sets
    );
    if (!workout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 });
    }
    return NextResponse.json(workout);
  } catch (error) {
    console.error("PUT /api/workouts error:", error);
    return NextResponse.json(
      { error: "Failed to update workout" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const id = getWorkoutId(request);
  if (id === null) {
    return NextResponse.json({ error: "A valid workout ID is required" }, { status: 400 });
  }

  try {
    const deletedCount = await deleteWorkout(id);
    if (deletedCount === 0) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/workouts error:", error);
    return NextResponse.json(
      { error: "Failed to delete workout" },
      { status: 500 }
    );
  }
}
