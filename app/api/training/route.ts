import { NextRequest, NextResponse } from "next/server";
import { getTrainingSessions, addTrainingSession, deleteTrainingSession } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const sessions = await getTrainingSessions(user.id);
    return NextResponse.json(sessions);
  } catch (error) {
    console.error("GET /api/training error:", error);
    return NextResponse.json(
      { error: "Failed to fetch training sessions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { date, exercise, duration, distance, notes } = body;

    if (!date || !exercise || !duration) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const session = await addTrainingSession(
      user.id,
      date,
      exercise,
      parseInt(duration),
      distance ? parseFloat(distance) : undefined,
      notes
    );

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error("POST /api/training error:", error);
    return NextResponse.json(
      { error: "Failed to add training session" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing session ID" },
        { status: 400 }
      );
    }

    await deleteTrainingSession(user.id, parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/training error:", error);
    return NextResponse.json(
      { error: "Failed to delete training session" },
      { status: 500 }
    );
  }
}
