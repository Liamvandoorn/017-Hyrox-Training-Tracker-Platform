import { NextResponse } from "next/server";
import { countUsers } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [user, userCount] = await Promise.all([getCurrentUser(), countUsers()]);
    return NextResponse.json({
      user: user
        ? { id: user.id, displayName: user.displayName, role: user.role }
        : null,
      setupRequired: userCount === 0,
    });
  } catch (error) {
    console.error("GET /api/auth/session error:", error);
    return NextResponse.json({ error: "Could not check sign-in status" }, { status: 500 });
  }
}
