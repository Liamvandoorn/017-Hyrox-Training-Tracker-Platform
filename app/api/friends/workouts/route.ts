import { NextRequest, NextResponse } from "next/server";
import { getFriends, getFriendsWorkouts, getUserWorkouts } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

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

    const friends = await getFriends(user.id);
    const friendIds = friends.map((f) => f.id);

    const userWorkouts = await getUserWorkouts(user.id, dateParam);
    const friendsWorkouts = await getFriendsWorkouts(friendIds, dateParam);

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
