"use client";

interface SimpleChartProps {
  type: "line" | "bar";
  data: number[];
  labels: string[];
  color?: "orange" | "blue" | "green";
}

export default function SimpleChart({
  type,
  data,
  labels,
  color = "orange",
}: SimpleChartProps) {
  const colorClass =
    color === "orange"
      ? "#f97316"
      : color === "blue"
        ? "#3b82f6"
        : "#10b981";

  if (data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-gray-500 text-sm">No data yet</p>
      </div>
    );
  }

  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;

  return (
    <svg viewBox="0 0 400 150" className="w-full h-full">
      {/* Grid lines */}
      {[0, 1, 2, 3].map((i) => (
        <line
          key={`grid-${i}`}
          x1="40"
          y1={30 + i * 30}
          x2="390"
          y2={30 + i * 30}
          stroke="#374151"
          strokeWidth="1"
          strokeDasharray="2,2"
        />
      ))}

      {/* Y-axis */}
      <line x1="40" y1="20" x2="40" y2="130" stroke="#6b7280" strokeWidth="2" />

      {/* X-axis */}
      <line x1="40" y1="130" x2="390" y2="130" stroke="#6b7280" strokeWidth="2" />

      {/* Data line/bars */}
      {type === "line" && (
        <polyline
          points={data
            .map(
              (value, idx) =>
                `${40 + (idx * 350) / (data.length - 1 || 1)},${130 - ((value - minValue) / range) * 100}`
            )
            .join(" ")}
          fill="none"
          stroke={colorClass}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      )}

      {type === "bar" &&
        data.map((value, idx) => (
          <rect
            key={`bar-${idx}`}
            x={40 + idx * (350 / data.length) + 5}
            y={130 - ((value - minValue) / range) * 100}
            width={(350 / data.length) * 0.8}
            height={((value - minValue) / range) * 100}
            fill={colorClass}
            opacity="0.8"
          />
        ))}

      {/* Labels */}
      {labels.map((label, idx) => (
        <text
          key={`label-${idx}`}
          x={40 + (idx * 350) / (labels.length - 1 || 1)}
          y="145"
          textAnchor="middle"
          fontSize="10"
          fill="#9ca3af"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}
