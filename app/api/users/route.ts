import { NextResponse } from "next/server";
import { getUsers } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allUsers = await getUsers();
    // Filter to only active users and return only id and displayName
    const activeUsers = allUsers
      .filter((u: { active: boolean }) => u.active)
      .map((u: { id: number; displayName: string }) => ({
        id: u.id,
        displayName: u.displayName,
      }));

    return NextResponse.json(activeUsers);
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: "Could not load users" }, { status: 500 });
  }
}
