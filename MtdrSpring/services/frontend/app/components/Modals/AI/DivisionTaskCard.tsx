import React from "react";
import type { Task } from "~/types";
import { formatDate, generateAvatarColor } from "~/lib/utils";

interface DivisionTaskCardProps {
  task: Task;
  onClick: () => void;
  onSelect: () => void;
  isSelected: boolean;
  recommendation?: string;
  subtaskCount: number;
  onSubtaskCountChange: (count: number) => void;
}

export function DivisionTaskCard({
  task,
  onClick,
  onSelect,
  isSelected,
  recommendation,
  subtaskCount,
  onSubtaskCountChange,
}: DivisionTaskCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick();
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };

  const handleSubtaskCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    let newValue = parseInt(e.target.value);

    // Ensure the value is within bounds
    if (isNaN(newValue)) {
      newValue = 3; // Default value
    } else if (newValue < 2) {
      newValue = 2; // Minimum
    } else if (newValue > 5) {
      newValue = 5; // Maximum
    }

    onSubtaskCountChange(newValue);
  };

  const handleCounterClick = (increment: boolean) => (e: React.MouseEvent) => {
    e.stopPropagation();
    const newValue = increment ? subtaskCount + 1 : subtaskCount - 1;
    if (newValue >= 2 && newValue <= 5) {
      onSubtaskCountChange(newValue);
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-lg transition-all duration-150 ${
        isSelected
          ? "ring-2 ring-blue-500 ring-offset-1 ring-offset-stone-800"
          : "border-oc-outline-light border"
      }`}
    >
      {/* Selection background overlay */}
      {isSelected && <div className="absolute inset-0 bg-blue-900/10"></div>}

      <div
        className="bg-oc-primary cursor-pointer p-4 transition-colors hover:bg-stone-700/30"
        onClick={handleClick}
      >
        <div className="mb-3 flex items-start justify-between">
          <div className="flex flex-1 items-center">
            <div
              className="mr-3 flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center rounded border border-gray-400 hover:bg-stone-700"
              onClick={handleCheckboxClick}
            >
              {isSelected && (
                <i className="fa fa-check text-xs text-blue-400"></i>
              )}
            </div>
            <h3
              className="flex-1 text-sm font-medium text-white"
              title={task.title}
            >
              {task.title}
            </h3>
          </div>

          {/* Subtask count control */}
          <div
            className="bg-oc-neutral-light/40 border-oc-outline-light/50 ml-2 flex h-7 items-center rounded border"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="flex h-full w-7 items-center justify-center text-xs text-gray-400 hover:text-white disabled:opacity-30"
              onClick={handleCounterClick(false)}
              disabled={subtaskCount <= 2}
            >
              <i className="fa fa-minus"></i>
            </button>
            <input
              type="number"
              min="2"
              max="5"
              value={subtaskCount}
              onChange={handleSubtaskCountChange}
              onClick={(e) => e.stopPropagation()}
              className="h-full w-7 border-x border-stone-600/50 bg-transparent text-center text-xs text-white"
            />
            <button
              type="button"
              className="flex h-full w-7 items-center justify-center text-xs text-gray-400 hover:text-white disabled:opacity-30"
              onClick={handleCounterClick(true)}
              disabled={subtaskCount >= 5}
            >
              <i className="fa fa-plus"></i>
            </button>
          </div>
        </div>

        {/* Task information */}
        <div className="mb-3 flex flex-wrap gap-3 text-xs">
          <span
            className={`rounded-md border px-2 py-0.5 ${
              task.tag === "Feature"
                ? "border-green-700/50 text-green-300"
                : "border-red-700/50 text-red-300"
            } inline-block`}
          >
            {task.tag}
          </span>

          <span className="text-oc-text-gray rounded-md border border-stone-600/50 px-2 py-0.5">
            {task.status}
          </span>

          {task.estimatedHours && (
            <span className="rounded-md border border-amber-700/30 px-2 py-0.5 text-amber-300">
              <i className="fa fa-clock mr-1"></i>
              {task.estimatedHours}h
            </span>
          )}
        </div>

        {/* Dates and assignees */}
        <div className="mb-2 flex justify-between text-xs text-stone-400">
          <div title={`Fecha inicio: ${formatDate(task.startDate)}`}>
            <i className="fa fa-calendar-alt mr-1"></i>
            {formatDate(task.startDate)}
            {task.endDate && (
              <span>
                <i className="fa fa-arrow-right mx-1"></i>
                {formatDate(task.endDate)}
              </span>
            )}
          </div>

          {task.assignees && task.assignees.length > 0 && (
            <div className="flex items-center">
              <i className="fa fa-users mr-1"></i>
              <div className="flex -space-x-1">
                {task.assignees.slice(0, 3).map((assignee, i) => {
                  const name = assignee?.name || "Unknown";
                  const colors = generateAvatarColor(name);
                  return (
                    <span
                      key={i}
                      style={{
                        backgroundColor: colors.backgroundColor,
                        color: colors.color,
                      }}
                      className="border-oc-outline-light flex h-5 w-5 items-center justify-center rounded-full border text-xs font-bold"
                      title={name}
                    >
                      {name.slice(0, 1)}
                    </span>
                  );
                })}
                {task.assignees.length > 3 && (
                  <span className="border-oc-outline-light flex h-5 w-5 items-center justify-center rounded-full border bg-stone-700 text-xs">
                    +{task.assignees.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* AI Recommendation */}
        {recommendation && (
          <div className="mt-3 rounded-md border border-amber-800/30 bg-amber-950/40 p-2 text-xs text-amber-300">
            <i className="fa fa-lightbulb mr-2"></i>
            {recommendation}
          </div>
        )}
      </div>
    </div>
  );
}
