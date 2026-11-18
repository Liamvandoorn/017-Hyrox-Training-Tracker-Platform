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
        <div className="bg-offwhite rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-darkgrey text-center mb-2">
            Hyrox Training
          </h1>
          <p className="text-gray-600 text-center mb-8">Tracker</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="passcode"
                className="block text-sm font-medium text-darkgrey mb-2"
              >
                Enter Passcode
              </label>
              <input
                id="passcode"
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSubmit(e as any)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-darkgrey text-darkgrey text-center text-2xl tracking-widest"
                placeholder="••••"
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-darkgrey text-offwhite font-bold py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Unlock
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
