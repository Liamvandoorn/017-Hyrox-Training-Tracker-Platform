import { NextRequest, NextResponse } from "next/server";
import {
  addWorkoutPlan,
  deleteWorkoutPlan,
  getWorkoutPlans,
  updateWorkoutPlan,
} from "@/lib/db";
import { requiresWeight, requiresWeightAndDistance } from "@/lib/types";
import type { WorkoutSet, WorkoutSetUnit, WorkoutPlan } from "@/lib/types";

export const dynamic = "force-dynamic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isWorkoutSetUnit(value: unknown): value is WorkoutSetUnit {
  return value === "m" || value === "kg" || value === "reps";
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
    value.restSeconds <= 86400
  );
}

function validatePlanInput(
  body: unknown
): { value: { name: string; sets: WorkoutSet[] } } | { error: string } {
  if (!isRecord(body)) return { error: "Invalid plan data" };

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 120) {
    return { error: "A plan name up to 120 characters is required" };
  }
  if (!Array.isArray(body.sets) || body.sets.length === 0 || body.sets.length > 100) {
    return { error: "Add between 1 and 100 valid sets" };
  }

  const sets = body.sets.filter(isWorkoutSet);
  if (sets.length !== body.sets.length) {
    return { error: "Plan contains an invalid set" };
  }

  return {
    value: {
      name,
      sets: sets.map((set) => ({ ...set, completed: false })),
    },
  };
}

function getPlanId(request: NextRequest): number | null {
  const value = new URL(request.url).searchParams.get("id");
  if (!value || !/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
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

export async function GET() {
  try {
    return NextResponse.json(await getWorkoutPlans());
  } catch (error) {
    console.error("GET /api/plans error:", error);
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const validation = validatePlanInput(body);
  if ("error" in validation) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const plan = await addWorkoutPlan(validation.value.name, validation.value.sets);
    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("POST /api/plans error:", error);
    return NextResponse.json({ error: "Failed to save plan" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const id = getPlanId(request);
  if (id === null) {
    return NextResponse.json({ error: "A valid plan ID is required" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }
  const validation = validatePlanInput(body);
  if ("error" in validation) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const plan = await updateWorkoutPlan(id, validation.value.name, validation.value.sets);
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    return NextResponse.json(plan);
  } catch (error) {
    console.error("PUT /api/plans error:", error);
    return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const id = getPlanId(request);
  if (id === null) {
    return NextResponse.json({ error: "A valid plan ID is required" }, { status: 400 });
  }

  try {
    const deletedCount = await deleteWorkoutPlan(id);
    if (deletedCount === 0) return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/plans error:", error);
    return NextResponse.json({ error: "Failed to delete plan" }, { status: 500 });
  }
}
