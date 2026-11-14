"use client";

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  isLoading?: boolean;
}

export default function ChartContainer({
  title,
  subtitle,
  children,
  isLoading,
}: ChartContainerProps) {
  return (
    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-offwhite">{title}</h3>
        {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
      </div>

      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-700 rounded w-32"></div>
          </div>
        </div>
      ) : (
        <div className="h-48">{children}</div>
      )}
    </div>
  );
}
