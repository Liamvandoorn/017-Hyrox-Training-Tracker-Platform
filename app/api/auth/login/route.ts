import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  createSessionToken,
  getPinDigest,
  getRateLimitDigest,
  getSessionDigest,
} from "@/lib/auth";
import {
  clearLoginAttempts,
  createSession,
  getUserByPinDigest,
  isLoginBlocked,
  recordFailedLogin,
} from "@/lib/db";
import { getSessionExpiry } from "@/lib/session";

export const dynamic = "force-dynamic";

function getAttemptKey(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const address = request.headers.get("x-real-ip")?.trim()
    || forwardedFor?.split(",").at(-1)?.trim()
    || "unknown";
  return getRateLimitDigest(`login-ip:${address}`);
}

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

  const pin = typeof body === "object" && body !== null && "pin" in body
    ? body.pin
    : null;
  if (typeof pin !== "string" || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: "Enter your 4-digit PIN" }, { status: 400 });
  }

  try {
    const attemptKey = getAttemptKey(request);
    const retryAfter = await isLoginBlocked(attemptKey);
    if (retryAfter !== null) {
      return NextResponse.json(
        { error: "Too many incorrect PIN attempts. Try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const user = await getUserByPinDigest(getPinDigest(pin));
    if (!user) {
      await recordFailedLogin(attemptKey);
      return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
    }

    await clearLoginAttempts(attemptKey);
    const token = createSessionToken();
    const expiresAt = getSessionExpiry();
    await createSession(user.id, getSessionDigest(token), expiresAt);
    const response = NextResponse.json({
      user: { id: user.id, displayName: user.displayName, role: user.role },
    });
    setSessionCookie(response, token, expiresAt);
    return response;
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json({ error: "Could not sign in" }, { status: 500 });
  }
}
