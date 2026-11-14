"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AITrainingSummary from "@/components/AITrainingSummary";
import BestTimesBox from "@/components/BestTimesBox";
import ChartContainer from "@/components/ChartContainer";
import DayCarousel from "@/components/DayCarousel";
import Navbar from "@/components/Navbar";
import SimpleChart from "@/components/SimpleChart";
import TotalTimeBox from "@/components/TotalTimeBox";

const weeklyRunningData = [12, 16, 14, 19, 22, 18, 20];
const simulationTimeData = [132, 128, 125, 122, 119, 116, 118];
const weekLabels = ["W1", "W2", "W3", "W4", "W5", "W6", "W7"];

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const router = useRouter();

  const signOut = () => {
    localStorage.removeItem("hyrox_authenticated");
    router.replace("/");
  };

  return (
    <main className="min-h-screen px-3 pb-28 pt-5 sm:px-5 sm:pt-8">
      <div className="mx-auto max-w-[760px] space-y-4 sm:space-y-5">
        <header className="flex items-center justify-between px-1 pb-1">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#66839a]">HYROX · TRAINING LOG</p>
            <h1 className="mt-1 text-[23px] font-semibold tracking-[-0.04em] text-[#202d37] sm:text-[28px]">
              Good morning, athlete
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
              {selectedDate.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <button
            type="button"
            onClick={signOut}
            aria-label="Sign out"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/80 bg-white/70 text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-800"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden="true">
              <path d="M10 17l5-5-5-5M15 12H3" />
              <path d="M12 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
            </svg>
          </button>
        </header>

        <DayCarousel onDaySelect={setSelectedDate} />

        <section className="grid grid-cols-[minmax(0,1.45fr)_minmax(102px,0.82fr)] gap-3 rounded-[1.7rem] border border-white/85 bg-white/85 p-3.5 shadow-[0_14px_38px_rgba(47,68,85,0.08)] sm:gap-5 sm:rounded-[2rem] sm:p-5">
          <BestTimesBox />
          <TotalTimeBox totalTime="1:58:20" lastUpdated="Demo time" />
        </section>

        <section aria-label="Training trends" className="grid grid-cols-2 gap-3 sm:gap-4">
          <ChartContainer title="Weekly running" subtitle="20 km this week · preview">
            <SimpleChart data={weeklyRunningData} labels={weekLabels} color="blue" />
          </ChartContainer>
          <ChartContainer title="HYROX simulation" subtitle="1:58:20 best · preview">
            <SimpleChart data={simulationTimeData} labels={weekLabels} color="orange" />
          </ChartContainer>
        </section>

        <AITrainingSummary summary="Your training summary will appear here once workout logging is connected. Keep recording your sessions to see trends in running volume, station pace, and recovery." />
      </div>
      <Navbar />
    </main>
  );
}
