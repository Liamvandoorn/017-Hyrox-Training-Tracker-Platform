"use client";

interface TotalTimeBoxProps {
  totalTime?: string;
  lastUpdated?: string;
}

export default function TotalTimeBox({
  totalTime = "1:58:20",
  lastUpdated,
}: TotalTimeBoxProps) {
  return (
    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 flex flex-col items-center justify-center h-full">
      <div className="text-5xl mb-4">🔥</div>
      <p className="text-gray-400 text-sm uppercase tracking-wider mb-4">
        Total Time
      </p>
      <p className="text-4xl font-bold text-orange-500">{totalTime}</p>
      {lastUpdated && (
        <p className="text-xs text-gray-500 mt-4">{lastUpdated}</p>
      )}
    </div>
  );
}
