"use client";

interface TotalTimeBoxProps {
  totalTime?: string;
  lastUpdated?: string;
}

export default function TotalTimeBox({
  totalTime = "1:58:20",
  lastUpdated = "Personal best",
}: TotalTimeBoxProps) {
  return (
    <div className="relative flex min-h-full flex-col items-center justify-center overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-[#344b5c] via-[#273744] to-[#1d2933] px-2 py-4 text-center text-white shadow-[0_12px_28px_rgba(27,42,54,0.2)] sm:rounded-[1.5rem] sm:px-4">
      <div aria-hidden="true" className="absolute -right-7 -top-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
      <span className="relative mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[#ffbd75]">
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
          <path d="M12.5 2.8c.7 3.2-.8 4.5-2.1 6.1-1 1.2-1.6 2.4-1.4 4.1.3 1.7 1.6 2.8 3.2 2.8 2.2 0 3.6-1.8 3.3-4.3 2 1.6 3.2 3.8 2.8 6.1-.5 3.1-3.1 5.2-6.5 5.2-4 0-6.8-2.8-6.8-6.6 0-2.7 1.5-4.8 3.5-6.9 1.8-1.8 3.1-3.6 4-6.5Z" fill="currentColor" />
        </svg>
      </span>
      <p className="relative text-[9px] font-semibold uppercase tracking-[0.16em] text-white/60 sm:text-[10px]">Total time</p>
      <p className="relative mt-2 text-[clamp(1.05rem,5vw,1.8rem)] font-semibold tracking-tight tabular-nums sm:mt-3">{totalTime}</p>
      <span className="relative mt-2 rounded-full bg-white/10 px-2 py-1 text-[9px] font-medium text-white/65 sm:text-[10px]">{lastUpdated}</span>
    </div>
  );
}
