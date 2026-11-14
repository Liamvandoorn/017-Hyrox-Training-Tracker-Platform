"use client";

interface SimpleChartProps {
  data: number[];
  labels: string[];
  color?: "orange" | "blue" | "green";
}

export default function SimpleChart({ data, labels, color = "blue" }: SimpleChartProps) {
  if (data.length === 0) {
    return <div className="flex h-full items-center justify-center text-xs text-slate-400">No data yet</div>;
  }

  const stroke = color === "orange" ? "#ee9a48" : color === "green" ? "#65a68a" : "#648baa";
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((value, index) => {
    const x = 8 + (index * 224) / Math.max(data.length - 1, 1);
    const y = 12 + ((max - value) / range) * 47;
    return `${x},${y}`;
  });
  const areaPath = `M ${points[0]} L ${points.slice(1).join(" L ")} L 232,70 L 8,70 Z`;

  return (
    <svg
      viewBox="0 0 240 88"
      className="h-full w-full overflow-visible"
      role="img"
      aria-label={`Training trend: ${labels.map((label, index) => `${label} ${data[index]}`).join(", ")}`}
      preserveAspectRatio="none"
    >
      {[20, 42, 64].map((y) => (
        <line key={y} x1="4" y1={y} x2="236" y2={y} stroke="#e8edf1" strokeWidth="1" />
      ))}
      <path d={areaPath} fill={stroke} opacity="0.09" />
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
      {labels.map((label, index) => (
        <text
          key={`${label}-${index}`}
          x={8 + (index * 224) / Math.max(labels.length - 1, 1)}
          y="84"
          fill="#9aa6b0"
          fontSize="8"
          textAnchor={index === 0 ? "start" : index === labels.length - 1 ? "end" : "middle"}
        >
          {label}
        </text>
      ))}
    </svg>
  );
}
