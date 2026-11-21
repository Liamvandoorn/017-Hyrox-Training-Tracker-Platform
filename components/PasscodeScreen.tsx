"use client";

import { useState } from "react";

interface PasscodeScreenProps {
  onUnlock: () => void;
}

export default function PasscodeScreen({ onUnlock }: PasscodeScreenProps) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (passcode.length === 0) {
      setError("Please enter a passcode");
      return;
    }

    // Verify passcode - using simple client-side verification for PWA
    const CORRECT_PASSCODE = process.env.NEXT_PUBLIC_PASSCODE || "1234";
    if (passcode === CORRECT_PASSCODE) {
      localStorage.setItem("hyrox_authenticated", "true");
      onUnlock();
    } else {
      setError("Incorrect passcode");
      setPasscode("");
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-[2rem] border border-white/10 bg-[#1c1c1f] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
          <h1 className="text-3xl font-bold text-[#f3f2f4] text-center mb-2">
            Hyrox Training
          </h1>
          <p className="text-[#b8b3ba] text-center mb-8">Tracker</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="passcode"
                className="block text-sm font-medium text-[#f3f2f4] mb-2"
              >
                Enter Passcode
              </label>
              <input
                id="passcode"
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSubmit(e as any)}
                className="w-full rounded-xl border border-white/20 bg-[#27272b] px-4 py-3 text-center text-2xl tracking-widest text-[#f3f2f4] focus:border-[#ef7890]"
                placeholder="••••"
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-[#3d2425] border border-[#714342] text-[#ffa8a4] px-4 py-2 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-[#f16b84] py-3 font-bold text-[#290f18] transition-colors hover:bg-[#ff91a5]"
            >
              Unlock
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
