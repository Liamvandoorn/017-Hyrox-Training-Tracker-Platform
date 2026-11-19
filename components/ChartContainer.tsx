"use client";

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function ChartContainer({ title, subtitle, children }: ChartContainerProps) {
  return (
    <section className="min-w-0 overflow-hidden rounded-[1.4rem] border border-white/10 bg-[#1c1c1f] p-3.5 shadow-[0_12px_30px_rgba(47,68,85,0.06)] backdrop-blur-sm sm:rounded-[1.7rem] sm:p-5">
      <div className="min-h-[54px]">
        <h2 className="text-[11px] font-semibold leading-snug tracking-tight text-[#f3f2f4] sm:text-sm">{title}</h2>
        {subtitle && <p className="mt-1 text-[10px] font-medium text-[#aaa5ad] sm:text-xs">{subtitle}</p>}
      </div>
      <div className="h-32 w-full sm:h-36">{children}</div>
    </section>
  );
}
