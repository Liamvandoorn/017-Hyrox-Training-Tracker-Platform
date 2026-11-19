"use client";

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function ChartContainer({ title, subtitle, children }: ChartContainerProps) {
  return (
    <section className="min-w-0 overflow-hidden rounded-[1.4rem] border border-white/80 bg-white/75 p-3.5 shadow-[0_12px_30px_rgba(47,68,85,0.06)] backdrop-blur-sm sm:rounded-[1.7rem] sm:p-5">
      <div className="min-h-[54px]">
        <h2 className="text-[11px] font-semibold leading-snug tracking-tight text-slate-800 sm:text-sm">{title}</h2>
        {subtitle && <p className="mt-1 text-[10px] font-medium text-slate-400 sm:text-xs">{subtitle}</p>}
      </div>
      <div className="h-32 w-full sm:h-36">{children}</div>
    </section>
  );
}
