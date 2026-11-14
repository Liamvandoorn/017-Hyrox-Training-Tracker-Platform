"use client";

interface AITrainingSummaryProps {
  summary?: string;
  isLoading?: boolean;
  onGenerateSummary?: () => void;
}

export default function AITrainingSummary({
  summary = "Your training data will appear here once you log your first workout.",
  isLoading,
  onGenerateSummary,
}: AITrainingSummaryProps) {
  return (
    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-offwhite">Training Summary</h3>
        <button
          onClick={onGenerateSummary}
          disabled={isLoading}
          className="text-xs bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-darkgrey font-semibold px-3 py-1 rounded transition-colors"
        >
          {isLoading ? "Generating..." : "Generate"}
        </button>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 min-h-32">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-4 bg-gray-700 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-700 rounded w-5/6 animate-pulse"></div>
            <div className="h-4 bg-gray-700 rounded w-4/6 animate-pulse"></div>
          </div>
        ) : (
          <p className="text-gray-300 text-sm leading-relaxed">{summary}</p>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-4 text-center">
        AI-powered insights about your training progress
      </p>
    </div>
  );
}
