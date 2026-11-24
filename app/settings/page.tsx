"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import AdminUserManager from "@/components/AdminUserManager";
import { useAuth } from "@/components/AuthProvider";
import WorkoutHistoryManager from "@/components/WorkoutHistoryManager";
import WorkoutPlanBuilder from "@/components/WorkoutPlanBuilder";
import ProfilePhotoManager from "@/components/ProfilePhotoManager";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-transparent pb-28 pt-5">
      <header className="mx-auto max-w-2xl px-4 pb-2">
        <div className="py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f69aaa]">HYROX · TRAINING LOG</p>
          <h1 className="mt-1 text-[25px] font-semibold tracking-[-0.04em] text-[#f2eff2]">Settings</h1>
          <p className="mt-1 text-sm text-[#aaa5ad]">Manage your app preferences.</p>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-5 rounded-[1.7rem] border border-white/10 bg-[#1c1c1f] p-5 shadow-sm sm:p-7">
          <h2 className="text-lg font-semibold text-[#f3f2f4]">Signed-in account</h2>
          <p className="mt-2 text-sm text-[#aaa5ad]">
            {user?.displayName} · {user?.role === "admin" ? "Administrator" : "Member"}
          </p>
        </div>

        <ProfilePhotoManager />

        {user?.role === "admin" && <AdminUserManager />}

        <WorkoutPlanBuilder />

        <WorkoutHistoryManager />

        {/* App Info Section */}
        <div className="mb-5 rounded-[1.7rem] border border-white/10 bg-[#1c1c1f] p-5 shadow-sm sm:p-7">
          <h2 className="mb-6 text-lg font-semibold text-[#f3f2f4]">App information</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 py-3">
              <span className="text-[#b8b3ba]">App version</span>
              <span className="font-semibold text-[#f3f2f4]">1.0.0</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/10 py-3">
              <span className="text-[#b8b3ba]">Database status</span>
              <span className="flex items-center gap-2 font-semibold text-[#8ed9b1]">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-[#b8b3ba]">PWA installed</span>
              <span className="font-semibold text-[#f3f2f4]">Yes</span>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="rounded-[1.7rem] border border-white/10 bg-[#1c1c1f] p-5 shadow-sm sm:p-7">
          <h2 className="mb-4 text-lg font-semibold text-[#f3f2f4]">About Hyrox Tracker</h2>
          <p className="mb-6 leading-relaxed text-[#cbc7cd]">
            Hyrox Training Tracker is your personal fitness companion designed
            to help you track, analyze, and optimize your training for Hyrox
            competitions. Monitor your progress, set personal records, and
            achieve your fitness goals.
          </p>

          <div className="flex gap-3">
            <Link
              href="https://www.hyrox.com"
              target="_blank"
              className="flex-1 rounded-xl bg-[#f16b84] py-3 text-center font-semibold text-[#290f18] transition-colors hover:bg-[#ff91a5]"
            >
              Learn about Hyrox
            </Link>
            <button className="flex-1 rounded-xl border border-white/10 bg-[#27272b] py-3 font-semibold text-[#e2e0e3] transition-colors hover:bg-[#303034]">
              Feedback
            </button>
          </div>
        </div>
      </div>
      <Navbar />
    </div>
  );
}
