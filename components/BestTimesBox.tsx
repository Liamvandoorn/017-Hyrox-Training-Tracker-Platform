"use client";

export type BestTimeKey =
  | "running"
  | "skiing"
  | "rowing"
  | "sledPull"
  | "sledPush"
  | "burpeeBroad"
  | "sandbagLunges"
  | "farmerCarries"
  | "wallBalls";

export type BestTimes = Partial<Record<BestTimeKey, string>>;

interface BestTimesBoxProps {
  times?: BestTimes;
  status?: string;
}

export default function BestTimesBox({ times, status }: BestTimesBoxProps) {
  const exercises = [
    { label: "Running", value: times?.running },
    { label: "SkiErg", value: times?.skiing },
    { label: "Rowing", value: times?.rowing },
    { label: "Sled pull", value: times?.sledPull },
    { label: "Sled push", value: times?.sledPush },
    { label: "Burpee broad jumps", value: times?.burpeeBroad },
    { label: "Sandbag lunges", value: times?.sandbagLunges },
    { label: "Farmer carries", value: times?.farmerCarries },
    { label: "Wall balls", value: times?.wallBalls },
  ];

  return (
    <section aria-labelledby="best-times-heading" className="min-w-0">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#aaa5ad]">Your benchmarks</p>
          <h2 id="best-times-heading" className="mt-1 text-base font-semibold tracking-tight text-[#f3f2f4] sm:text-lg">
            Best times
          </h2>
        </div>
        <span className="rounded-full bg-[#30282d] px-2.5 py-1 text-[10px] font-semibold text-[#b8b3ba]">HYROX</span>
      </div>
      {status && <p role="status" className="mb-1 text-[10px] text-[#aaa5ad]">{status}</p>}
      <ul className="space-y-0.5">
        {exercises.map((exercise) => (
          <li key={exercise.label} className="flex items-center justify-between gap-2 border-b border-white/10 py-[5px] last:border-0">
            <span className="truncate text-[11px] font-medium text-[#b8b3ba] sm:text-xs">{exercise.label}</span>
            <span className="shrink-0 text-[11px] font-semibold tabular-nums text-[#f3f2f4] sm:text-xs">
              {exercise.value || "—"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
