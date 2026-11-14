"use client";

import { useState, useEffect } from "react";

interface DayCarouselProps {
  onDaySelect?: (date: Date) => void;
}

export default function DayCarousel({ onDaySelect }: DayCarouselProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [daysArray, setDaysArray] = useState<Date[]>([]);

  useEffect(() => {
    const today = new Date();
    const days: Date[] = [];
    
    // Get 3 days before and after today
    for (let i = -3; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    setDaysArray(days);
  }, []);

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    onDaySelect?.(date);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const formatDay = (date: Date) => {
    return date.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
  };

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex gap-2 px-4 justify-center md:justify-start">
        {daysArray.map((date, idx) => (
          <button
            key={idx}
            onClick={() => handleDayClick(date)}
            className={`flex-shrink-0 px-4 py-3 rounded-full font-semibold transition-all duration-200 min-w-fit ${
              isSelected(date)
                ? "bg-orange-500 text-darkgrey shadow-lg scale-105"
                : isToday(date)
                ? "bg-gray-700 text-offwhite border-2 border-orange-500"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs">{formatDay(date).split(" ")[0]}</span>
              <span className="text-sm">{formatDay(date).split(" ")[1]}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
