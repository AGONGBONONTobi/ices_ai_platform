import React from "react";

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showValue?: boolean;
}

export default function CircularProgress({
  value,
  max = 100,
  size = 60,
  strokeWidth = 4,
  className = "",
  showValue = true,
}: CircularProgressProps) {
  const safeValue = typeof value === "number" && !isNaN(value) ? value : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (safeValue / max) * circumference;

  let colorClass = "text-red-500";
  if (safeValue >= 70) colorClass = "text-emerald-500";
  else if (safeValue >= 40) colorClass = "text-amber-500";

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg className="absolute top-0 left-0" width={size} height={size}>
        <circle
          className="text-slate-200"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`${colorClass} transition-all duration-1000 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
        />
      </svg>
      {showValue && (
        <span
          className="absolute font-semibold text-slate-700"
          style={{ fontSize: size * 0.25 }}
        >
          {safeValue}
        </span>
      )}
    </div>
  );
}
