import React from "react";

interface ShadowTaskProps {
  title: string;
  tag: "Feature" | "Bug";
  sprint: string;
  startDate: string;
  endDate: string;
  style: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
  };
  opacity: number;
  rotation: number;
  scale?: number;
}

export function ShadowTask({
  title,
  tag,
  sprint,
  startDate,
  endDate,
  style,
  opacity,
  rotation,
  scale = 1,
}: ShadowTaskProps) {
  const isFeature = tag === "Feature";

  return (
    <div
      className="absolute w-56"
      style={{
        ...style,
        opacity,
        transform: `scale(${scale}) rotate(${rotation}deg)`,
      }}
    >
      <div className="bg-oc-primary border-oc-outline-light rounded-lg border p-3 shadow-md">
        <div className="mb-2 flex items-start justify-between">
          <h3 className="flex-1 truncate text-sm font-medium text-white/70">
            {title}
          </h3>
        </div>
        <div className="mb-2 flex items-center justify-between">
          <span
            className={`rounded-md border px-2 py-0.5 text-xs ${
              isFeature
                ? "border-green-700/50 text-green-300/70"
                : "border-red-700/50 text-red-300/70"
            }`}
          >
            {tag}
          </span>
          <span className="text-xs text-stone-400/70">{sprint}</span>
        </div>
        <div className="mb-2 flex justify-between text-xs text-stone-400/70">
          <div>
            <i className="fa fa-calendar-alt mr-1"></i>
            {startDate}
          </div>
          <div>
            <i className="fa fa-flag-checkered mr-1"></i>
            {endDate}
          </div>
        </div>
      </div>
    </div>
  );
}
