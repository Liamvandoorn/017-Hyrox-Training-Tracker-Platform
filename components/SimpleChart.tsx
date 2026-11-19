"use client";

interface SimpleChartProps {
  data: number[];
  labels: string[];
  color?: "orange" | "blue" | "green";
  unit?: "km" | "seconds" | "count";
  description?: string;
}

function formatValue(value: number, unit: NonNullable<SimpleChartProps["unit"]>): string {
  if (unit === "seconds") {
    const seconds = Math.round(value);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainder = String(seconds % 60).padStart(2, "0");
    return hours > 0
      ? `${hours}:${String(minutes).padStart(2, "0")}:${remainder}`
      : `${minutes}:${remainder}`;
  }
  return String(Number(value.toFixed(unit === "count" ? 1 : 5)));
}

export default function SimpleChart({
  data,
  labels,
  color = "blue",
  unit = "count",
  description = "Training trend",
}: SimpleChartProps) {
  if (data.length === 0) {
    return <div className="flex h-full items-center justify-center text-xs text-slate-400">No data yet</div>;
  }

  const stroke = color === "orange" ? "#ee9a48" : color === "green" ? "#65a68a" : "#648baa";
  const dataMax = Math.max(...data);
  const dataMin = Math.min(...data);
  const padding = Math.max(
    (dataMax - dataMin) * 0.1,
    dataMax * 0.05,
    unit === "seconds" ? 1 : unit === "km" ? 0.00001 : 0.1
  );
  const min = Math.max(0, dataMin - padding);
  const max = dataMax + padding;
  const range = max - min;
  const xStart = 55;
  const xEnd = 310;
  const yTop = 12;
  const yBottom = 105;
  const xForIndex = (index: number) =>
    data.length === 1 ? (xStart + xEnd) / 2 : xStart + (index * (xEnd - xStart)) / (data.length - 1);
  const points = data.map((value, index) => {
    const x = xForIndex(index);
    const y = yTop + ((max - value) / range) * (yBottom - yTop);
    return `${x},${y}`;
  });
  const areaPath = `M ${points[0]} L ${points.slice(1).join(" L ")} L ${xEnd},${yBottom} L ${xStart},${yBottom} Z`;
  const tickIndexes = new Set([0, Math.floor((labels.length - 1) / 2), labels.length - 1]);

  return (
    <svg
      viewBox="0 0 320 130"
      className="h-full w-full overflow-visible"
      role="img"
      aria-label={`${description}: ${labels.map((label, index) => `${label} ${formatValue(data[index], unit)}${unit === "km" ? " km" : ""}`).join(", ")}`}
      preserveAspectRatio="none"
    >
      {[0, 0.5, 1].map((fraction) => (
        <g key={fraction}>
          <line x1={xStart} y1={yTop + fraction * (yBottom - yTop)} x2={xEnd} y2={yTop + fraction * (yBottom - yTop)} stroke="#e8edf1" strokeWidth="1" />
          <text x={xStart - 5} y={yTop + fraction * (yBottom - yTop)} dy="0.35em" fill="#718295" fontSize="9" textAnchor="end">
            {formatValue(max - fraction * range, unit)}
          </text>
        </g>
      ))}
      {points.length > 1 && <path d={areaPath} fill={stroke} opacity="0.09" />}
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {points.map((point, index) => {
        const [cx, cy] = point.split(",");
        return <circle key={`${labels[index]}-${index}`} cx={cx} cy={cy} r="2" fill={stroke} />;
      })}
      {labels.map((label, index) => tickIndexes.has(index) && (
        <text
          key={`${label}-${index}`}
          x={xForIndex(index)}
          y="125"
          fill="#9aa6b0"
          fontSize="9"
          textAnchor={labels.length === 1 ? "middle" : index === 0 ? "start" : index === labels.length - 1 ? "end" : "middle"}
        >
          {label}
        </text>
      ))}
    </svg>
  );
}
