"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import WorkoutHistoryManager from "@/components/WorkoutHistoryManager";
import WorkoutPlanBuilder from "@/components/WorkoutPlanBuilder";

export default function SettingsPage() {
  const [passcode, setPasscode] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const handleSavePasscode = () => {
    // Placeholder for passcode update logic
    setSaveMessage("Settings saved successfully.");
    setTimeout(() => setSaveMessage(""), 3000);
  };

  return (
    <div className="min-h-screen bg-transparent pb-28 pt-5">
      <header className="mx-auto max-w-2xl px-4 pb-2">
        <div className="py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f4a06b]">HYROX · TRAINING LOG</p>
          <h1 className="mt-1 text-[25px] font-semibold tracking-[-0.04em] text-[#edf3f8]">Settings</h1>
          <p className="mt-1 text-sm text-[#a99b93]">Manage your app preferences.</p>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {saveMessage && (
          <div className="mb-6 rounded-xl border border-[#36594a] bg-[#1d3028] px-5 py-4 text-sm text-[#a6e6c1]">
            {saveMessage}
          </div>
        )}

        {/* Security Section */}
        <div className="mb-5 rounded-[1.7rem] border border-white/10 bg-[#201d1c] p-5 shadow-sm sm:p-7">
          <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-[#f6efea]">Security</h2>

          <div className="space-y-6">
            <div>
              <label className="mb-3 block text-sm font-semibold text-[#e7dcd5]">
                App Passcode
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type={showPasscode ? "text" : "password"}
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Current passcode"
                    className="w-full rounded-xl border border-white/10 bg-[#292522] px-4 py-3 text-[#f6efea] outline-none transition-colors placeholder:text-[#a99b93] focus:border-[#ed874b]"
                  />
                  <button
                    onClick={() => setShowPasscode(!showPasscode)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#a99b93] hover:text-[#e7dcd5]"
                  >
                    {showPasscode ? "Hide" : "Show"}
                  </button>
                </div>
                <button
                  onClick={handleSavePasscode}
                  className="rounded-xl bg-[#f47f3e] px-5 py-3 font-semibold text-[#28160e] transition-colors hover:bg-[#ff9a59]"
                >
                  Update
                </button>
              </div>
              <p className="mt-2 text-xs text-[#a99b93]">
                This is your app login passcode. Keep it secure!
              </p>
            </div>
          </div>
        </div>

        <WorkoutPlanBuilder />

        <WorkoutHistoryManager />

        {/* App Info Section */}
        <div className="mb-5 rounded-[1.7rem] border border-white/10 bg-[#201d1c] p-5 shadow-sm sm:p-7">
          <h2 className="mb-6 text-lg font-semibold text-[#f6efea]">App information</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 py-3">
              <span className="text-[#b8a9a0]">App version</span>
              <span className="font-semibold text-[#f6efea]">1.0.0</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/10 py-3">
              <span className="text-[#b8a9a0]">Database status</span>
              <span className="flex items-center gap-2 font-semibold text-[#8ed9b1]">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-[#b8a9a0]">PWA installed</span>
              <span className="font-semibold text-[#f6efea]">Yes</span>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="rounded-[1.7rem] border border-white/10 bg-[#201d1c] p-5 shadow-sm sm:p-7">
          <h2 className="mb-4 text-lg font-semibold text-[#f6efea]">About Hyrox Tracker</h2>
          <p className="mb-6 leading-relaxed text-[#d1c1b8]">
            Hyrox Training Tracker is your personal fitness companion designed
            to help you track, analyze, and optimize your training for Hyrox
            competitions. Monitor your progress, set personal records, and
            achieve your fitness goals.
          </p>

          <div className="flex gap-3">
            <Link
              href="https://www.hyrox.com"
              target="_blank"
              className="flex-1 rounded-xl bg-[#f47f3e] py-3 text-center font-semibold text-[#28160e] transition-colors hover:bg-[#ff9a59]"
            >
              Learn about Hyrox
            </Link>
            <button className="flex-1 rounded-xl border border-white/10 bg-[#292522] py-3 font-semibold text-[#e7dcd5] transition-colors hover:bg-[#302b28]">
              Feedback
            </button>
          </div>
        </div>
      </div>
      <Navbar />
    </div>
  );
}
