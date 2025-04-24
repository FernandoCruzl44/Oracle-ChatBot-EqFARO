import React from "react";
import type { Task } from "~/types";
import { formatDate, generateAvatarColor } from "~/lib/utils";

interface SelectionTaskCardProps {
  task: Task;
  onClick: () => void;
  selected: boolean;
  onToggleSelect: () => void;
  subtaskCount: number;
  onSubtaskCountChange: (count: number) => void;
  recommendation?: string;
}

export function SelectionTaskCard({
  task,
  onClick,
  selected,
  onToggleSelect,
  subtaskCount,
  onSubtaskCountChange,
  recommendation,
}: SelectionTaskCardProps) {
  // Handle subtask count changes
  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (subtaskCount < 5) {
      onSubtaskCountChange(subtaskCount + 1);
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (subtaskCount > 2) {
      onSubtaskCountChange(subtaskCount - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      const clampedValue = Math.min(5, Math.max(2, value));
      onSubtaskCountChange(clampedValue);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    onClick();
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect();
  };

  // Convert dates to readable format
  const startDateFormatted = formatDate(task.startDate);
  const endDateFormatted = task.endDate ? formatDate(task.endDate) : null;

  return (
    <div
      className={`relative rounded-lg transition-all duration-200 ${
        selected ? "outline-1" : "outline outline-gray-700"
      }`}
    >
      {/* Selection background */}
      {selected && (
        <div className="pointer-events-none absolute inset-0 rounded-lg bg-blue-900/10" />
      )}

      <div
        className="bg-oc-primary relative z-10 rounded-lg p-4 hover:bg-stone-700/30"
        onClick={handleCardClick}
      >
        {/* Header section with title and controls */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center">
            {/* Custom checkbox */}
            <div
              className={`mr-3 flex h-5 w-5 cursor-pointer items-center justify-center rounded border ${
                selected ? "border-blue-500 bg-blue-900/30" : "border-gray-400"
              }`}
              onClick={handleCheckboxClick}
            >
              {selected && <i className="fa fa-check text-xs text-blue-400" />}
            </div>

            {/* Task title */}
            <h3 className="text-sm font-medium text-white">{task.title}</h3>
          </div>

          {/* Subtask counter */}
          <div
            className="bg-oc-primary/50 flex h-7 items-center rounded border border-gray-600"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center text-gray-400 hover:text-white disabled:opacity-30"
              onClick={handleDecrement}
              disabled={subtaskCount <= 2}
            >
              <i className="fa fa-minus text-xs" />
            </button>

            <input
              value={subtaskCount}
              min={2}
              max={5}
              onChange={handleInputChange}
              onClick={(e) => e.stopPropagation()}
              className="h-full w-8 border-x border-gray-600 bg-transparent text-center text-xs text-white"
            />

            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center text-gray-400 hover:text-white disabled:opacity-30"
              onClick={handleIncrement}
              disabled={subtaskCount >= 5}
            >
              <i className="fa fa-plus text-xs" />
            </button>
          </div>
        </div>

        {/* Tags section */}
        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          <span
            className={`inline-block rounded-md border px-2 py-0.5 ${
              task.tag === "Feature"
                ? "border-green-700/50 text-green-300"
                : "border-red-700/50 text-red-300"
            }`}
          >
            {task.tag}
          </span>

          <span className="inline-block rounded-md border border-gray-600 px-2 py-0.5 text-gray-300">
            {task.status}
          </span>

          {task.estimatedHours && (
            <span className="inline-block rounded-md border border-amber-700/30 px-2 py-0.5 text-amber-300">
              <i className="fa fa-clock mr-1"></i>
              {task.estimatedHours}h
            </span>
          )}
        </div>

        {/* Dates and assignees */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div>
            <i className="fa fa-calendar-alt mr-1"></i>
            {startDateFormatted}
            {endDateFormatted && (
              <span>
                <i className="fa fa-arrow-right mx-1"></i>
                {endDateFormatted}
              </span>
            )}
          </div>

          {task.assignees && task.assignees.length > 0 && (
            <div className="flex items-center">
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
                      className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-700 text-xs font-bold"
                      title={name}
                    >
                      {name.slice(0, 1)}
                    </span>
                  );
                })}
                {task.assignees.length > 3 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-700 bg-gray-700 text-xs">
                    +{task.assignees.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* AI Recommendation */}
        {recommendation && (
          <div className="mt-3 rounded border border-amber-700/30 bg-amber-900/20 p-2 text-xs text-amber-300">
            <i className="fa fa-lightbulb mr-1"></i>
            {recommendation}
          </div>
        )}
      </div>
    </div>
  );
}
