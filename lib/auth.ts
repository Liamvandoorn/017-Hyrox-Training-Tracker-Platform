const PASSCODE = process.env.NEXT_PUBLIC_PASSCODE || "1234";

export function verifyPasscode(code: string): boolean {
  return code === PASSCODE;
}
