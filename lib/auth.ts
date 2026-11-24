import { createHash, createHmac, randomBytes } from "node:crypto";

export const SESSION_COOKIE_NAME = "hyrox_session";
export const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

function getPinPepper(): string {
  const pepper = process.env.PIN_PEPPER;
  if (!pepper || pepper.length < 32) {
    throw new Error("PIN_PEPPER must be set to a random value of at least 32 characters");
  }
  return pepper;
}

export function getPinDigest(pin: string): string {
  return createHmac("sha256", getPinPepper()).update(`pin:${pin}`).digest("hex");
}

export function getRateLimitDigest(value: string): string {
  return createHmac("sha256", getPinPepper()).update(value).digest("hex");
}

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function getSessionDigest(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
