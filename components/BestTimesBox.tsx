"use client";

interface BestTimesBoxProps {
  times?: {
    running?: string;
    skiing?: string;
    rowing?: string;
    sledPull?: string;
    sledPush?: string;
    burpeeBroad?: string;
    sandbagLunges?: string;
    wallBalls?: string;
  };
}

export default function BestTimesBox({ times }: BestTimesBoxProps) {
  const exercises = [
    { label: "Running", value: times?.running },
    { label: "SkiErg", value: times?.skiing },
    { label: "Rowing", value: times?.rowing },
    { label: "Sled pull", value: times?.sledPull },
    { label: "Sled push", value: times?.sledPush },
    { label: "Burpee broad jumps", value: times?.burpeeBroad },
    { label: "Sandbag lunges", value: times?.sandbagLunges },
    { label: "Wall balls", value: times?.wallBalls },
  ];

  return (
    <section aria-labelledby="best-times-heading" className="min-w-0">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Your benchmarks</p>
          <h2 id="best-times-heading" className="mt-1 text-base font-semibold tracking-tight text-slate-800 sm:text-lg">
            Best times
          </h2>
        </div>
        <span className="rounded-full bg-[#edf3f7] px-2.5 py-1 text-[10px] font-semibold text-slate-500">HYROX</span>
      </div>
      <ul className="space-y-0.5">
        {exercises.map((exercise) => (
          <li key={exercise.label} className="flex items-center justify-between gap-2 border-b border-slate-100/90 py-[5px] last:border-0">
            <span className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">{exercise.label}</span>
            <span className="shrink-0 text-[11px] font-semibold tabular-nums text-slate-800 sm:text-xs">
              {exercise.value || "—"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
