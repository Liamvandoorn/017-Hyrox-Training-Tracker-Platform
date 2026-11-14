import { NextRequest, NextResponse } from "next/server";
import { addWorkout, getWorkouts } from "@/lib/db";
import type { WorkoutSet, WorkoutSetUnit, WorkoutSource } from "@/lib/types";

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
    isWorkoutSetUnit(value.unit) &&
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

export async function GET() {
  try {
    const workouts = await getWorkouts();
    return NextResponse.json(workouts);
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

  if (!isRecord(body)) {
    return NextResponse.json({ error: "Invalid workout data" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const source = body.source;
  const rawSets = body.sets;

  if (!name || name.length > 120 || !isValidDate(body.date)) {
    return NextResponse.json(
      { error: "A workout name and valid date are required" },
      { status: 400 }
    );
  }

  if (source !== "own" && source !== "plan") {
    return NextResponse.json({ error: "Invalid workout source" }, { status: 400 });
  }

  if (!Array.isArray(rawSets) || rawSets.length === 0 || rawSets.length > 100) {
    return NextResponse.json({ error: "Add between 1 and 100 valid sets" }, { status: 400 });
  }

  const sets = rawSets.filter(isWorkoutSet);
  if (sets.length !== rawSets.length) {
    return NextResponse.json({ error: "Workout contains an invalid set" }, { status: 400 });
  }

  if (!sets.every((set) => set.completed)) {
    return NextResponse.json({ error: "All sets must be completed before saving" }, { status: 400 });
  }

  try {
    const workout = await addWorkout(
      name,
      body.date,
      source,
      sets
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
