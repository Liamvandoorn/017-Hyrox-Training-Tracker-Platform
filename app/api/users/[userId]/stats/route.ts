import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import type { WorkoutRecord, WorkoutSet, WorkoutSource } from "@/lib/types";

type BestTimeKey =
  | "running"
  | "skiing"
  | "rowing"
  | "sledPull"
  | "sledPush"
  | "burpeeBroad"
  | "sandbagLunges"
  | "farmerCarries"
  | "wallBalls";

export const dynamic = "force-dynamic";

function getWeeklyRunningTrend(workouts: WorkoutRecord[]) {
  const dailyRunningPaces = new Map<string, number>();
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];
    dailyRunningPaces.set(dateStr, Infinity);
  }

  for (const workout of workouts) {
    const dateStr = workout.date.substring(0, 10);
    if (!dailyRunningPaces.has(dateStr)) continue;
    for (const set of workout.sets) {
      if (set.category.toLowerCase().includes("running") && set.completed) {
        const distance = set.amount;
        const timeSeconds = set.timeSeconds;
        if (distance > 0 && timeSeconds > 0) {
          const pace = timeSeconds / distance;
          dailyRunningPaces.set(dateStr, Math.min(dailyRunningPaces.get(dateStr)!, pace));
        }
      }
    }
  }

  return Array.from(dailyRunningPaces.entries())
    .map(([date, pace]) => ({ date, pace: pace === Infinity ? 0 : pace }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`
    : `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function calculateBestTimes(workouts: WorkoutRecord[]) {
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

  const result: Record<string, string> = {};

  for (const workout of workouts) {
    for (const set of workout.sets) {
      if (!set.completed) continue;

      const categoryLower = set.category.toLowerCase();
      const matchedKey = Object.entries(bestTimeKeys).find(([key]) =>
        categoryLower.includes(key)
      );

      if (!matchedKey) continue;

      const [, timeKey] = matchedKey;
      const minimum = bestTimeMinimums[timeKey];

      if (!minimum) continue;

      const meetsMinimum =
        (minimum.unit === "m" && set.amount >= minimum.amount) ||
        (minimum.unit === "reps" && set.amount >= minimum.amount) ||
        (minimum.weightKg !== undefined &&
          set.weightKg !== undefined &&
          set.weightKg >= minimum.weightKg &&
          set.amount >= minimum.amount);

      if (!meetsMinimum) continue;

      const timeStr = formatDuration(set.timeSeconds);
      if (!result[timeKey] || set.timeSeconds < parseInt(result[timeKey])) {
        result[timeKey] = timeStr;
      }
    }
  }

  return result;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const { userId } = await params;
    const targetUserId = parseInt(userId, 10);

    if (isNaN(targetUserId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Get target user info
    const userResult = await query(
      `SELECT id, display_name AS "displayName"
       FROM app_users
       WHERE id = $1`,
      [targetUserId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetUser = userResult.rows[0];

    // Get all workouts for the target user
    const workoutsResult = await query(
      `SELECT id, name, date::text AS date, source, sets, created_at
       FROM workouts
       WHERE user_id = $1
       ORDER BY date DESC
       LIMIT 100`,
      [targetUserId]
    );

    const workouts: WorkoutRecord[] = workoutsResult.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      date: row.date,
      source: row.source as WorkoutSource,
      sets: typeof row.sets === 'string' ? JSON.parse(row.sets) : (row.sets as WorkoutSet[]),
      created_at: row.created_at,
    }));

    // Calculate stats
    const totalWorkouts = workouts.length;
    const totalTimeSeconds = workouts.reduce((total, workout) => {
      return total + workout.sets.reduce((setTotal, set) => setTotal + (set.completed ? set.timeSeconds : 0), 0);
    }, 0);

    const bestTimes = calculateBestTimes(workouts);
    const runningTrend = getWeeklyRunningTrend(workouts);
    const recentWorkouts = workouts.slice(0, 10);

    return NextResponse.json({
      userId: targetUser.id,
      displayName: targetUser.displayName,
      bestTimes,
      stats: {
        totalWorkouts,
        totalTimeSeconds,
        averageTimePerWorkout: totalWorkouts > 0 ? totalTimeSeconds / totalWorkouts : 0,
      },
      runningTrend,
      recentWorkouts,
    });
  } catch (error) {
    console.error(`GET /api/users/[userId]/stats error:`, error);
    return NextResponse.json(
      { error: "Could not load user stats" },
      { status: 500 }
    );
  }
}
