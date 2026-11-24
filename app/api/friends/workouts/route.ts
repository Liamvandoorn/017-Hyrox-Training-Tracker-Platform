import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import type { WorkoutRecord, WorkoutSet, WorkoutSource } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const dateParam = request.nextUrl.searchParams.get("date");
    if (!dateParam) {
      return NextResponse.json({ error: "date parameter required" }, { status: 400 });
    }

    // Get current user's workouts
    const userWorkoutsResult = await query(
      `SELECT id, name, date::text AS date, source, sets, created_at
       FROM workouts
       WHERE user_id = $1 AND date = $2
       ORDER BY created_at DESC`,
      [user.id, dateParam]
    );
    const userWorkouts: WorkoutRecord[] = userWorkoutsResult.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      date: row.date,
      source: row.source as WorkoutSource,
      sets: typeof row.sets === 'string' ? JSON.parse(row.sets) : (row.sets as WorkoutSet[]),
      created_at: row.created_at,
    }));

    // Get all OTHER users (all are friends by default) and their workouts
    const friendsWorkoutsResult = await query(
      `SELECT 
         u.id AS user_id, 
         u.display_name AS "displayName",
         w.id, 
         w.name, 
         w.date, 
         w.source, 
         w.sets, 
         w.created_at
       FROM workouts w
       JOIN app_users u ON u.id = w.user_id
       WHERE w.user_id != $1 AND w.date = $2 AND u.active = TRUE
       ORDER BY u.display_name, w.created_at DESC`,
      [user.id, dateParam]
    );

    // Group friend workouts by user
    interface FriendWorkoutRow {
      user_id: number;
      displayName: string;
      id: number;
      name: string;
      date: string;
      source: string;
      sets: string | WorkoutSet[];
      created_at: string;
    }

    const grouped: Record<number, { userId: number; displayName: string; workouts: WorkoutRecord[] }> = {};
    for (const row of friendsWorkoutsResult.rows as FriendWorkoutRow[]) {
      if (!grouped[row.user_id]) {
        grouped[row.user_id] = {
          userId: row.user_id,
          displayName: row.displayName,
          workouts: [],
        };
      }
      grouped[row.user_id].workouts.push({
        id: row.id,
        name: row.name,
        date: row.date,
        source: row.source as WorkoutSource,
        sets: typeof row.sets === 'string' ? JSON.parse(row.sets) : (row.sets as WorkoutSet[]),
        created_at: row.created_at,
      });
    }
    const friendsWorkouts = Object.values(grouped);

    // Get all active users for friend list
    const friendsResult = await query(
      `SELECT id, display_name AS "displayName"
       FROM app_users
       WHERE id != $1 AND active = TRUE
       ORDER BY display_name ASC`,
      [user.id]
    );
    const friends = friendsResult.rows;

    return NextResponse.json({
      userWorkouts,
      friendsWorkouts,
      friends,
    });
  } catch (error) {
    console.error("GET /api/friends/workouts error:", error);
    return NextResponse.json(
      { error: "Could not load friend workouts" },
      { status: 500 }
    );
  }
}
