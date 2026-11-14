"use client";

import { useState } from "react";

interface DayCarouselProps {
  onDaySelect?: (date: Date) => void;
}

function getWeekDays(center: Date) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(center);
    date.setDate(center.getDate() + index - 3);
    return date;
  });
}

export default function DayCarousel({ onDaySelect }: DayCarouselProps) {
  const [today] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const days = getWeekDays(today);

  const selectDate = (date: Date) => {
    setSelectedDate(date);
    onDaySelect?.(date);
  };

  return (
    <section aria-label="Choose a day" className="rounded-[1.65rem] border border-white/80 bg-white/55 p-3 shadow-[0_12px_30px_rgba(47,68,85,0.06)] backdrop-blur-sm">
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((date) => {
          const selected = date.toDateString() === selectedDate.toDateString();
          const isToday = date.toDateString() === today.toDateString();

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => selectDate(date)}
              aria-pressed={selected}
              aria-label={date.toLocaleDateString("en", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
              className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-[1.15rem] py-2.5 transition duration-200 sm:py-3 ${
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
              {isToday && (
                <span className={`h-1 w-1 rounded-full ${selected ? "bg-[#f5a85d]" : "bg-[#5c84a5]"}`} />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
