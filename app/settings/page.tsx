"use client";

import { useState } from "react";
import Link from "next/link";

export default function SettingsPage() {
  const [passcode, setPasscode] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const handleSavePasscode = () => {
    // Placeholder for passcode update logic
    setSaveMessage("Settings saved successfully! 🎉");
    setTimeout(() => setSaveMessage(""), 3000);
  };

  return (
    <div className="min-h-screen bg-darkgrey pb-24 md:pb-0">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-offwhite mb-2">Settings</h1>
          <p className="text-gray-400">Manage your app preferences</p>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {saveMessage && (
          <div className="mb-6 bg-green-900/30 border border-green-700 text-green-300 px-6 py-4 rounded-xl">
            {saveMessage}
          </div>
        )}

        {/* Security Section */}
        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-offwhite mb-6 flex items-center gap-2">
            🔐 Security
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-offwhite mb-3">
                App Passcode
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type={showPasscode ? "text" : "password"}
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Current passcode"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-offwhite placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                  <button
                    onClick={() => setShowPasscode(!showPasscode)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-offwhite"
                  >
                    {showPasscode ? "Hide" : "Show"}
                  </button>
                </div>
                <button
                  onClick={handleSavePasscode}
                  className="bg-orange-500 hover:bg-orange-600 text-darkgrey font-bold px-6 py-3 rounded-lg transition-colors"
                >
                  Update
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                This is your app login passcode. Keep it secure!
              </p>
            </div>
          </div>
        </div>

        {/* App Info Section */}
        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-offwhite mb-6 flex items-center gap-2">
            ℹ️ App Information
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-700">
              <span className="text-gray-400">App Version</span>
              <span className="text-offwhite font-semibold">1.0.0</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-700">
              <span className="text-gray-400">Database Status</span>
              <span className="text-green-400 font-semibold flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                Connected
              </span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-400">PWA Installed</span>
              <span className="text-offwhite font-semibold">Yes</span>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-offwhite mb-4 flex items-center gap-2">
            🏃 About Hyrox Tracker
          </h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            Hyrox Training Tracker is your personal fitness companion designed
            to help you track, analyze, and optimize your training for Hyrox
            competitions. Monitor your progress, set personal records, and
            achieve your fitness goals.
          </p>

          <div className="flex gap-3">
            <Link
              href="https://www.hyrox.com"
              target="_blank"
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-darkgrey font-bold py-3 rounded-lg text-center transition-colors"
            >
              Learn about Hyrox
            </Link>
            <button className="flex-1 bg-gray-700 hover:bg-gray-600 text-offwhite font-bold py-3 rounded-lg transition-colors">
              Feedback
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
