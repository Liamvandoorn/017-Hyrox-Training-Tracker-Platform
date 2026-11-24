"use client";

import { useState } from "react";

const keypad = [
  { digit: "1", letters: "" },
  { digit: "2", letters: "ABC" },
  { digit: "3", letters: "DEF" },
  { digit: "4", letters: "GHI" },
  { digit: "5", letters: "JKL" },
  { digit: "6", letters: "MNO" },
  { digit: "7", letters: "PQRS" },
  { digit: "8", letters: "TUV" },
  { digit: "9", letters: "WXYZ" },
  { digit: "", letters: "" },
  { digit: "0", letters: "" },
  { digit: "", letters: "" },
];

export default function PasscodeScreen({ setupRequired }: { setupRequired: boolean }) {
  const [displayName, setDisplayName] = useState("");
  const [setupKey, setSetupKey] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitPin = async (value: string) => {
    if (value.length !== 4 || isSubmitting) return;
    setError("");

    if (setupRequired && (displayName.trim().length < 2 || !setupKey)) {
      setError("Enter your name and one-time setup key first.");
      setPin("");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(setupRequired ? "/api/auth/bootstrap" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          setupRequired
          ? { displayName, setupKey, pin: value }
          : { pin: value }
        ),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Could not sign in";
        throw new Error(message);
      }

      localStorage.removeItem("hyrox_authenticated");
      window.location.assign("/dashboard");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not sign in");
      setPin("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addDigit = (digit: string) => {
    if (isSubmitting || pin.length >= 4) return;
    const nextPin = `${pin}${digit}`;
    setPin(nextPin);
    setError("");
    if (nextPin.length === 4) {
      void submitPin(nextPin);
    }
  };

  const handlePinChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextPin = event.target.value.replace(/\D/g, "").slice(0, 4);
    setPin(nextPin);
    setError("");
    if (nextPin.length === 4) {
      void submitPin(nextPin);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-8">
      <main className="w-full max-w-sm">
        <div className="mb-7 flex justify-center text-[#f3f2f4]" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
            <path d="M7 10V7a5 5 0 0 1 10 0v3h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1Zm2 0h6V7a3 3 0 0 0-6 0v3Z" />
          </svg>
        </div>

        <h1 className="text-center text-[22px] font-medium tracking-tight text-[#f3f2f4]">
          {setupRequired ? "Set Up Your Passcode" : "Enter Passcode"}
        </h1>
        <p className="mt-1 text-center text-sm text-[#aaa5ad]" aria-live="polite">
          {isSubmitting ? "Please wait..." : setupRequired ? "Create your administrator account" : "Hyrox Training Tracker"}
        </p>

        {setupRequired && (
          <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs leading-relaxed text-[#aaa5ad]">
              First-time setup. Ask your app operator for the one-time setup key.
            </p>
            <label className="block text-xs font-medium text-[#d8d4da]">
              Your name
              <input
                autoComplete="name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                required
                minLength={2}
                maxLength={60}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#27272b] px-3 py-2.5 text-sm text-[#f3f2f4] outline-none focus:border-[#ef7890]"
              />
            </label>
            <label className="block text-xs font-medium text-[#d8d4da]">
              One-time setup key
              <input
                type="password"
                autoComplete="off"
                value={setupKey}
                onChange={(event) => setSetupKey(event.target.value)}
                required
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#27272b] px-3 py-2.5 text-sm text-[#f3f2f4] outline-none focus:border-[#ef7890]"
              />
            </label>
          </div>
        )}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submitPin(pin);
          }}
          className="mt-7"
        >
          <label htmlFor="pin" className="sr-only">
            {setupRequired ? "Choose a 4-digit PIN" : "Enter your 4-digit PIN"}
          </label>
          <input
            id="pin"
            type="password"
            inputMode="none"
            autoComplete="one-time-code"
            value={pin}
            onChange={handlePinChange}
            maxLength={4}
            aria-describedby={error ? "pin-error" : undefined}
            className="sr-only"
          />
          <div className="mb-8 flex justify-center gap-4" aria-hidden="true">
            {Array.from({ length: 4 }, (_, index) => (
              <span
                key={index}
                className={`h-3 w-3 rounded-full border border-white/70 transition-colors ${
                  pin.length > index ? "bg-[#f3f2f4]" : "bg-transparent"
                }`}
              />
            ))}
          </div>

          <div className="mx-auto grid max-w-[270px] grid-cols-3 justify-items-center gap-x-5 gap-y-3">
            {keypad.map(({ digit, letters }, index) =>
              digit ? (
                <button
                  key={digit}
                  type="button"
                  aria-label={`Enter ${digit}`}
                  disabled={isSubmitting}
                  onClick={() => addDigit(digit)}
                  className="flex h-[72px] w-[72px] flex-col items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.12] text-[#f7f6f7] shadow-sm transition active:scale-95 active:bg-white/25 disabled:opacity-50"
                >
                  <span className="text-[30px] font-light leading-none">{digit}</span>
                  {letters && (
                    <span className="mt-0.5 text-[8px] font-semibold tracking-[0.16em] text-white/75">
                      {letters}
                    </span>
                  )}
                </button>
              ) : (
                <span key={`empty-${index}`} className="h-[72px] w-[72px]" aria-hidden="true" />
              )
            )}
          </div>

          {error && (
            <div
              id="pin-error"
              role="alert"
              className="mx-auto mt-5 max-w-[300px] text-center text-sm text-[#ffa8a4]"
            >
              {error}
            </div>
          )}

          <div className="mx-auto mt-6 flex max-w-[300px] items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setPin("");
                setError("");
              }}
              disabled={!pin || isSubmitting}
              className="min-h-11 px-3 text-sm font-medium text-[#d8d4da] underline-offset-4 hover:text-white hover:underline disabled:opacity-40"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                setPin((current) => current.slice(0, -1));
                setError("");
              }}
              disabled={!pin || isSubmitting}
              className="min-h-11 px-3 text-sm font-medium text-[#d8d4da] underline-offset-4 hover:text-white hover:underline disabled:opacity-40"
            >
              Delete
            </button>
          </div>
        </form>

        {!setupRequired && (
          <p className="mt-5 text-center text-xs leading-relaxed text-[#8f8992]">
            Accounts are created by an administrator. Ask them for your unique PIN.
          </p>
        )}
      </main>
    </div>
  );
}
