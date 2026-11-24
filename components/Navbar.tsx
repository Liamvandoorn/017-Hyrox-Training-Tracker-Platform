"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import FriendsDirectory from "@/components/FriendsDirectory";
import WorkoutStartSheet, { WorkoutFlow } from "@/components/WorkoutStartSheet";
import { WORKOUT_DRAFT_KEY } from "@/lib/types";

const items = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <path d="M3.75 10.5 12 3.75l8.25 6.75v8.25a1.5 1.5 0 0 1-1.5 1.5h-4.5v-6h-4.5v6h-4.5a1.5 1.5 0 0 1-1.5-1.5V10.5Z" />,
  },
  {
    href: "/workout",
    label: "Log workout",
    icon: <><path d="M12 5v14M5 12h14" /><circle cx="12" cy="12" r="9" /></>,
  },
  {
    action: "friends",
    label: "Friends",
    icon: <><circle cx="4" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="20" cy="12" r="2" /></>,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8.4 8.4 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8.4 8.4 0 0 1-1.7-1l-1.7.7-1.4-2.4L7.3 15a8.1 8.1 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.7a8.4 8.4 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8.4 8.4 0 0 1 1.7 1l1.7-.7 1.4 2.4-1.4 1.1a8.1 8.1 0 0 1 0 2Z" /></>,
  },
];

export default function Navbar({ workoutInProgress = false }: { workoutInProgress?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isWorkoutSheetOpen, setIsWorkoutSheetOpen] = useState(false);
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);

  const startWorkout = (flow: WorkoutFlow) => {
    sessionStorage.setItem("hyrox_workout_flow", flow);
    setIsWorkoutSheetOpen(false);
    if (pathname !== "/workout") {
      router.push("/workout");
    } else {
      window.dispatchEvent(new Event("hyrox-workout-flow"));
    }
  };

  return (
    <>
      <nav aria-label="Main navigation" className="fixed bottom-[max(12px,env(safe-area-inset-bottom))] left-1/2 z-50 w-[calc(100%-24px)] max-w-[420px] -translate-x-1/2 rounded-[1.75rem] border border-white/10 bg-[#171719]/95 p-2 shadow-[0_16px_45px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        <div className="grid grid-cols-4 gap-1">
          {items.map((item) => {
            const isAction = "action" in item;
            const isActive = !isAction && pathname === item.href;
            const isFriendsActive = isAction && item.action === "friends" && isFriendsOpen;
            const className = `flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-[1.15rem] transition-colors ${
              isActive || (item.href === "/workout" && isWorkoutSheetOpen) || isFriendsActive
                ? "bg-[#f16b84] text-[#290f18] shadow-[0_5px_20px_rgba(241,107,132,0.26)]"
                : "text-[#b8b3ba] hover:bg-[#303034] hover:text-[#f3f2f4]"
            }`;

            if (isAction && item.action === "friends") {
              return (
                <button
                  key={item.action}
                  type="button"
                  aria-expanded={isFriendsOpen}
                  aria-haspopup="dialog"
                  onClick={() => setIsFriendsOpen((open) => !open)}
                  className={className}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden="true">
                    {item.icon}
                  </svg>
                  <span className="text-[9px] font-semibold tracking-wide">{item.label}</span>
                </button>
              );
            }

            if (item.href === "/workout") {
              return (
                <button
                  key={item.href}
                  type="button"
                  aria-expanded={isWorkoutSheetOpen}
                  aria-haspopup="dialog"
                  onClick={() => {
                    if (pathname === "/workout") {
                      window.dispatchEvent(new Event("hyrox-open-workout-sheet"));
                    } else {
                      try {
                        if (sessionStorage.getItem(WORKOUT_DRAFT_KEY) !== null) {
                          router.push("/workout");
                          return;
                        }
                        setIsWorkoutSheetOpen((open) => !open);
                      } catch (error) {
                        console.error("Could not check for an in-progress workout:", error);
                        router.push("/workout");
                      }
                    }
                  }}
                  className={className}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden="true">
                    {item.icon}
                  </svg>
                  <span className="text-[9px] font-semibold tracking-wide">{item.label}</span>
                </button>
              );
            }

            if (workoutInProgress) {
              return (
                <button
                  key={item.href}
                  type="button"
                  disabled
                  title="Unavailable during a workout"
                  className="flex min-h-[54px] cursor-not-allowed flex-col items-center justify-center gap-1 rounded-[1.15rem] text-[#55525a]"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden="true">
                    {item.icon}
                  </svg>
                  <span className="text-[9px] font-semibold tracking-wide">{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={"href" in item ? item.href : item.action}
                href={item.href as string}
                aria-current={isActive ? "page" : undefined}
                className={className}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden="true">
                  {item.icon}
                </svg>
                <span className="text-[9px] font-semibold tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      {isWorkoutSheetOpen && pathname !== "/workout" && (
        <WorkoutStartSheet
          onClose={() => setIsWorkoutSheetOpen(false)}
          onSelect={startWorkout}
        />
      )}
      {isFriendsOpen && <FriendsDirectory onClose={() => setIsFriendsOpen(false)} />}
    </>
  );
}
