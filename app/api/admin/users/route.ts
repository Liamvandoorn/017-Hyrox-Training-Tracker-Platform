import { NextRequest, NextResponse } from "next/server";
import { getPinDigest } from "@/lib/auth";
import { createUser, getUsers, setUserActive } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return {
      user: null,
      response: NextResponse.json({ error: "Administrator access required" }, { status: 403 }),
    };
  }
  return { user, response: null };
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    return NextResponse.json(await getUsers());
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json({ error: "Could not load accounts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid account information" }, { status: 400 });
  }
  const { displayName, pin } = body as Record<string, unknown>;
  const name = typeof displayName === "string" ? displayName.trim() : "";
  if (name.length < 2 || name.length > 60) {
    return NextResponse.json({ error: "Name must be between 2 and 60 characters" }, { status: 400 });
  }
  if (typeof pin !== "string" || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: "Choose a 4-digit PIN" }, { status: 400 });
  }

  try {
    const user = await createUser(name, getPinDigest(pin));
    return NextResponse.json(
      { id: user.id, displayName: user.displayName, role: user.role, active: user.active },
      { status: 201 }
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return NextResponse.json(
        { error: "That PIN is already assigned. Each account needs a unique PIN." },
        { status: 409 }
      );
    }
    console.error("POST /api/admin/users error:", error);
    return NextResponse.json({ error: "Could not create account" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid account information" }, { status: 400 });
  }

  const { id, active } = body as Record<string, unknown>;
  if (!Number.isSafeInteger(id) || typeof id !== "number" || typeof active !== "boolean") {
    return NextResponse.json({ error: "A valid account ID and active status are required" }, { status: 400 });
  }
  if (id === auth.user?.id && !active) {
    return NextResponse.json({ error: "You cannot deactivate your own account" }, { status: 400 });
  }

  try {
    const target = (await getUsers()).find((user: { id: number }) => user.id === id);
    if (!target) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    if (target.role === "admin" && !active) {
      return NextResponse.json({ error: "Administrator accounts cannot be deactivated here" }, { status: 400 });
    }
    const updated = await setUserActive(id, active);
    if (!updated) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/admin/users error:", error);
    return NextResponse.json({ error: "Could not update account" }, { status: 500 });
  }
}
