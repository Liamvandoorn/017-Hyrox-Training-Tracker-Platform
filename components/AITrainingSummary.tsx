"use client";

interface AITrainingSummaryProps {
  summary: string;
}

export default function AITrainingSummary({ summary }: AITrainingSummaryProps) {
  return (
    <section className="rounded-[1.65rem] border border-white/80 bg-white/75 p-4 shadow-[0_12px_30px_rgba(47,68,85,0.06)] backdrop-blur-sm sm:rounded-[1.9rem] sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eaf1f6] text-[#527b9f]">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
              <path d="M12 3.5v3M12 17.5v3M3.5 12h3m11 0h3m-13.4-6.4 2.1 2.1m7.6 7.6 2.1 2.1m0-11.8-2.1 2.1m-7.6 7.6-2.1 2.1M15.5 12a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight text-slate-800">Training overview</p>
            <p className="text-[10px] text-slate-400">AI coach summary · preview</p>
          </div>
        </div>
        <span className="rounded-full bg-[#f5f0e9] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wide text-[#ad7b4c]">Soon</span>
      </div>
      <label htmlFor="training-summary" className="sr-only">AI training summary</label>
      <textarea
        id="training-summary"
        readOnly
        value={summary}
        className="min-h-[104px] w-full resize-none rounded-[1.15rem] border border-slate-100 bg-[#f7f9fb] p-3.5 text-xs leading-relaxed text-slate-600 outline-none placeholder:text-slate-400 sm:min-h-[120px] sm:p-4 sm:text-sm"
      />
      <p className="mt-2 text-[10px] text-slate-400">Summary generation will be connected after workout data is available.</p>
    </section>
  );
}
