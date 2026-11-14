import { NextRequest, NextResponse } from "next/server";
import { getTrainingSessions, addTrainingSession, deleteTrainingSession } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const sessions = await getTrainingSessions();
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
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing session ID" },
        { status: 400 }
      );
    }

    await deleteTrainingSession(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/training error:", error);
    return NextResponse.json(
      { error: "Failed to delete training session" },
      { status: 500 }
    );
  }
}
