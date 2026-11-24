import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  createSessionToken,
  getPinDigest,
  getSessionDigest,
} from "@/lib/auth";
import { countUsers, createFirstAdmin, createSession } from "@/lib/db";
import { getSessionExpiry } from "@/lib/session";

export const dynamic = "force-dynamic";

function setSessionCookie(response: NextResponse, token: string, expiresAt: Date) {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid setup information" }, { status: 400 });
  }
  const { setupKey, displayName, pin } = body as Record<string, unknown>;
  const configuredKey = process.env.ADMIN_BOOTSTRAP_KEY;
  if (!configuredKey || configuredKey.length < 32) {
    return NextResponse.json(
      { error: "Set ADMIN_BOOTSTRAP_KEY to a random value of at least 32 characters first" },
      { status: 503 }
    );
  }
  if (typeof setupKey !== "string") {
    return NextResponse.json({ error: "Invalid setup key" }, { status: 403 });
  }
  const providedKey = Buffer.from(setupKey);
  const expectedKey = Buffer.from(configuredKey);
  if (
    providedKey.length !== expectedKey.length ||
    !timingSafeEqual(providedKey, expectedKey)
  ) {
    return NextResponse.json({ error: "Invalid setup key" }, { status: 403 });
  }

  const name = typeof displayName === "string" ? displayName.trim() : "";
  if (name.length < 2 || name.length > 60) {
    return NextResponse.json({ error: "Name must be between 2 and 60 characters" }, { status: 400 });
  }
  if (typeof pin !== "string" || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: "Choose a 4-digit PIN" }, { status: 400 });
  }

  try {
    if (await countUsers() > 0) {
      return NextResponse.json({ error: "Administrator setup is already complete" }, { status: 409 });
    }

    const user = await createFirstAdmin(name, getPinDigest(pin));
    if (!user) {
      return NextResponse.json({ error: "Administrator setup is already complete" }, { status: 409 });
    }

    const token = createSessionToken();
    const expiresAt = getSessionExpiry();
    await createSession(user.id, getSessionDigest(token), expiresAt);
    const response = NextResponse.json({
      user: { id: user.id, displayName: user.displayName, role: user.role },
    }, { status: 201 });
    setSessionCookie(response, token, expiresAt);
    return response;
  } catch (error) {
    console.error("POST /api/auth/bootstrap error:", error);
    return NextResponse.json({ error: "Could not create the administrator" }, { status: 500 });
  }
}
