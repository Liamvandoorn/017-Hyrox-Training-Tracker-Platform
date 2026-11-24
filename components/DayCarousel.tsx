"use client";

import { useEffect, useRef, useState } from "react";
import FriendAvatar from "@/components/FriendAvatar";
import ProfileAvatar from "@/components/ProfileAvatar";

interface DayCarouselProps {
  onDaySelect?: (date: Date) => void;
  workoutCounts?: Readonly<Record<string, number>>;
  friendsWithWorkouts?: Readonly<Record<string, number[]>>;
  currentUserId?: number;
  currentUserDisplayName?: string;
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

export default function DayCarousel({ onDaySelect, workoutCounts = {}, friendsWithWorkouts = {}, currentUserId, currentUserDisplayName = "You" }: DayCarouselProps) {
  const [today] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [isDragging, setIsDragging] = useState(false);
  const days = getCalendarDays(today);
  const selectedDayRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; scrollLeft: number; dragging: boolean } | null>(null);
  const suppressClickRef = useRef(false);

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

  const finishDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    suppressClickRef.current = dragRef.current.dragging;
    dragRef.current = null;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <section aria-label="Choose a day" className="rounded-[1.65rem] border border-white/10 bg-[#1c1c1f] p-3 shadow-[0_12px_30px_rgba(47,68,85,0.06)] backdrop-blur-sm">
      <div
        className={`flex gap-1.5 overflow-x-auto pb-1 sm:gap-2 ${isDragging ? "cursor-grabbing select-none" : "snap-x snap-mandatory cursor-grab"}`}
        onPointerDown={(event) => {
          suppressClickRef.current = false;
          if (event.pointerType !== "mouse" || event.button !== 0) return;
          dragRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            scrollLeft: event.currentTarget.scrollLeft,
            dragging: false,
          };
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current;
          if (!drag || drag.pointerId !== event.pointerId) return;
          const delta = event.clientX - drag.startX;
          if (!drag.dragging && Math.abs(delta) < 6) return;
          if (!drag.dragging) {
            drag.dragging = true;
            setIsDragging(true);
            event.currentTarget.setPointerCapture(event.pointerId);
          }
          event.preventDefault();
          event.currentTarget.scrollLeft = drag.scrollLeft - delta;
        }}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onLostPointerCapture={() => {
          dragRef.current = null;
          setIsDragging(false);
        }}
        onClickCapture={(event) => {
          if (suppressClickRef.current) {
            event.preventDefault();
            event.stopPropagation();
            suppressClickRef.current = false;
          }
        }}
        onDragStart={(event) => event.preventDefault()}
      >
        {days.map((date) => {
          const dateKey = getDateKey(date);
          const selected = dateKey === getDateKey(selectedDate);
          const isToday = dateKey === getDateKey(today);
          const workoutCount = workoutCounts[dateKey] ?? 0;
          const profileIds = friendsWithWorkouts[dateKey] ?? [];
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
                  ? "bg-[#d0d3d6] text-[#1b1c1e] shadow-[0_8px_18px_rgba(39,55,68,0.22)]"
                  : "text-[#b8b3ba] hover:bg-[#1c1c1f]"
              }`}
            >
              <span className={`text-[10px] font-semibold uppercase tracking-wide sm:text-[11px] ${selected ? "text-[#4c5055]" : ""}`}>
                {date.toLocaleDateString("en", { weekday: "short" })}
              </span>
              <span className={`text-sm font-semibold tabular-nums sm:text-base ${selected ? "text-[#1b1c1e]" : "text-[#f3f2f4]"}`}>
                {date.getDate()}
              </span>
              {/* Only show dot/count indicator if there are NO profile avatars to display */}
              {profileIds.length === 0 && (
                <span className="flex h-3 items-center gap-0.5">
                  {workoutCount > 0 ? (
                    <>
                      <span className={`h-1 w-1 rounded-full ${selected ? "bg-[#4c5055]" : "bg-[#d0d3d6]"}`} />
                      <span className={`text-[9px] font-semibold tabular-nums ${selected ? "text-[#4c5055]" : "text-[#b8b3ba]"}`}>
                        {workoutCount > 99 ? "99+" : workoutCount}
                      </span>
                    </>
                  ) : isToday ? (
                    <span className={`h-1 w-1 rounded-full ${selected ? "bg-[#4c5055]" : "bg-[#d0d3d6]"}`} />
                  ) : null}
                </span>
              )}
              {profileIds.length > 0 && (
                <div className="flex items-center justify-center mt-0.5">
                  {/* Rule 1: Only 1 user - show larger avatar */}
                  {profileIds.length === 1 && (
                    <div className="flex gap-0.5">
                      {profileIds[0] === currentUserId ? (
                        <ProfileAvatar displayName={currentUserDisplayName} size={18} />
                      ) : (
                        <FriendAvatar userId={profileIds[0]} size={18} />
                      )}
                    </div>
                  )}
                  
                  {/* Rule 2: 2-3 users - show adjacent avatars */}
                  {profileIds.length > 1 && profileIds.length < 4 && (
                    <div className="flex gap-0.5">
                      {profileIds.map((profileId) => (
                        profileId === currentUserId ? (
                          <ProfileAvatar key={profileId} displayName={currentUserDisplayName} size={16} />
                        ) : (
                          <FriendAvatar key={profileId} userId={profileId} size={16} />
                        )
                      ))}
                    </div>
                  )}
                  
                  {/* Rule 3: 4+ users - show 3 avatars with overlay on 2nd showing count */}
                  {profileIds.length >= 4 && (
                    <div className="relative flex gap-0.5">
                      {/* First avatar */}
                      {profileIds[0] === currentUserId ? (
                        <ProfileAvatar displayName={currentUserDisplayName} size={16} />
                      ) : (
                        <FriendAvatar userId={profileIds[0]} size={16} />
                      )}
                      
                      {/* Second avatar with overlay */}
                      <div className="relative">
                        {profileIds[1] === currentUserId ? (
                          <ProfileAvatar displayName={currentUserDisplayName} size={16} />
                        ) : (
                          <FriendAvatar userId={profileIds[1]} size={16} />
                        )}
                        <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                          <span className="text-[8px] font-bold text-white">
                            +{profileIds.length - 2}
                          </span>
                        </div>
                      </div>
                      
                      {/* Third avatar */}
                      {profileIds[2] === currentUserId ? (
                        <ProfileAvatar displayName={currentUserDisplayName} size={16} />
                      ) : (
                        <FriendAvatar userId={profileIds[2]} size={16} />
                      )}
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
