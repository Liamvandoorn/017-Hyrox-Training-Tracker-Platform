"use client";

import { useEffect, useRef, useState } from "react";

interface DayCarouselProps {
  onDaySelect?: (date: Date) => void;
  workoutCounts?: Readonly<Record<string, number>>;
}

function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCalendarDays(center: Date) {
  return Array.from({ length: 31 }, (_, index) => {
    const date = new Date(center);
    date.setDate(center.getDate() + index - 15);
    return date;
  });
}

export default function DayCarousel({ onDaySelect, workoutCounts = {} }: DayCarouselProps) {
  const [today] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const days = getCalendarDays(today);
  const selectedDayRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    selectedDayRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [selectedDate]);

  const selectDate = (date: Date) => {
    setSelectedDate(date);
    onDaySelect?.(date);
  };

  return (
    <section aria-label="Choose a day" className="rounded-[1.65rem] border border-white/80 bg-white/55 p-3 shadow-[0_12px_30px_rgba(47,68,85,0.06)] backdrop-blur-sm">
      <div className="flex snap-x snap-mandatory gap-1.5 overflow-x-auto pb-1 sm:gap-2">
        {days.map((date) => {
          const dateKey = getDateKey(date);
          const selected = dateKey === getDateKey(selectedDate);
          const isToday = dateKey === getDateKey(today);
          const workoutCount = workoutCounts[dateKey] ?? 0;
          const longDate = date.toLocaleDateString("en", {
            weekday: "long",
            month: "long",
            day: "numeric",
          });

          return (
            <button
              key={dateKey}
              ref={selected ? selectedDayRef : undefined}
              type="button"
              onClick={() => selectDate(date)}
              aria-pressed={selected}
              aria-label={`${longDate}, ${workoutCount} ${workoutCount === 1 ? "workout" : "workouts"} logged`}
              className={`flex w-10 flex-none snap-center flex-col items-center justify-center gap-1 rounded-[1.15rem] py-2.5 transition duration-200 sm:w-11 sm:py-3 ${
                selected
                  ? "bg-[#273744] text-white shadow-[0_8px_18px_rgba(39,55,68,0.22)]"
                  : "text-slate-500 hover:bg-white/80"
              }`}
            >
              <span className={`text-[10px] font-semibold uppercase tracking-wide sm:text-[11px] ${selected ? "text-white/65" : ""}`}>
                {date.toLocaleDateString("en", { weekday: "short" })}
              </span>
              <span className={`text-sm font-semibold tabular-nums sm:text-base ${selected ? "text-white" : "text-slate-800"}`}>
                {date.getDate()}
              </span>
              <span className="flex h-3 items-center gap-0.5">
                {workoutCount > 0 ? (
                  <>
                    <span className={`h-1 w-1 rounded-full ${selected ? "bg-[#f5a85d]" : "bg-[#5c84a5]"}`} />
                    <span className={`text-[9px] font-semibold tabular-nums ${selected ? "text-white/80" : "text-slate-500"}`}>
                      {workoutCount > 99 ? "99+" : workoutCount}
                    </span>
                  </>
                ) : isToday ? (
                  <span className={`h-1 w-1 rounded-full ${selected ? "bg-[#f5a85d]" : "bg-[#5c84a5]"}`} />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
