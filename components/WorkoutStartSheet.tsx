"use client";

export type WorkoutFlow = "own" | "plan";

interface WorkoutStartSheetProps {
  onSelect: (flow: WorkoutFlow) => void;
  onClose: () => void;
}

export default function WorkoutStartSheet({
  onSelect,
  onClose,
}: WorkoutStartSheetProps) {
  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label="Close workout options"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px]"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="workout-start-title"
        className="workout-sheet absolute left-1/2 w-[calc(100%-24px)] max-w-[420px] -translate-x-1/2 rounded-[1.7rem] border border-white/80 bg-white/95 p-4 shadow-[0_20px_60px_rgba(27,42,54,0.22)] backdrop-blur-xl sm:p-5"
        style={{ bottom: "calc(max(12px, env(safe-area-inset-bottom)) + 88px)" }}
      >
        <div className="mb-3 flex items-start justify-between px-1">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#66839a]">TODAY&apos;S SESSION</p>
            <h2 id="workout-start-title" className="mt-1 text-base font-semibold text-slate-800">How would you like to train?</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-4 w-4" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onSelect("plan")}
            className="rounded-[1.2rem] bg-[#edf3f7] p-3.5 text-left transition hover:bg-[#e3edf4]"
          >
            <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#527b9f]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <path d="M5 5h14M5 10h14M5 15h8M5 20h8" />
                <path d="m16 17 2 2 3-4" />
              </svg>
            </span>
            <span className="block text-xs font-semibold text-slate-800">Follow plan</span>
            <span className="mt-1 block text-[9px] leading-relaxed text-slate-500">Load planned sets</span>
          </button>
          <button
            type="button"
            onClick={() => onSelect("own")}
            className="rounded-[1.2rem] bg-[#f7efe5] p-3.5 text-left transition hover:bg-[#f2e7d8]"
          >
            <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#bf8249]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-4 w-4" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            <span className="block text-xs font-semibold text-slate-800">Log own workout</span>
            <span className="mt-1 block text-[9px] leading-relaxed text-slate-500">Build your own session</span>
          </button>
        </div>
      </section>
    </div>
  );
}
