// app/components/Tasks/TaskCard.tsx
import React from "react";
import type { Task } from "~/types";
import { formatDate, getSprintName, generateAvatarColor } from "~/lib/utils";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onSelect: () => void;
  isSelected: boolean;
  showAssignees: boolean;
  sprints: any[];
  isDragging?: boolean;
  isUpdating?: boolean;
}

export function TaskCard({
  task,
  onClick,
  onSelect,
  isSelected,
  showAssignees,
  sprints,
  isDragging = false,
  isUpdating = false,
}: TaskCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick();
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };

  return (
    <div
      className={`bg-oc-primary border-oc-outline-light cursor-pointer rounded-lg border p-3 transition-colors hover:bg-stone-700/30 ${
        isSelected ? "border-blue-500" : ""
      } ${isDragging ? "opacity-50" : ""} ${isUpdating ? "animate-pulse" : ""}`}
      onClick={handleClick}
    >
      <div className="mb-2 flex items-start justify-between">
        <h3
          className="flex-1 truncate text-sm font-medium text-white"
          title={task.title}
        >
          {task.title}
        </h3>
        <input
          type="checkbox"
          className="ml-2 h-4 w-4 flex-shrink-0"
          checked={isSelected}
          onChange={() => {}}
          onClick={handleCheckboxClick}
        />
      </div>

      <div className="mb-2 flex items-center justify-between">
        <span
          className={`rounded-md border px-2 py-0.5 text-xs ${
            task.tag === "Feature"
              ? "border-green-700/50 text-green-300"
              : "border-red-700/50 text-red-300"
          } inline-block`}
        >
          {task.tag}
        </span>

        {task.sprintId && (
          <span
            className="text-xs text-stone-400"
            title={getSprintName(sprints, task.sprintId)}
          >
            {getSprintName(sprints, task.sprintId)}
          </span>
        )}
      </div>

      <div className="mb-2 flex justify-between text-xs text-stone-400">
        <div title={`Fecha inicio: ${formatDate(task.startDate)}`}>
          <i className="fa fa-calendar-alt mr-1"></i>
          {formatDate(task.startDate)}
        </div>
        <div title={`Fecha fin: ${formatDate(task.endDate)}`}>
          <i className="fa fa-flag-checkered mr-1"></i>
          {formatDate(task.endDate)}
        </div>
      </div>

      {showAssignees && task.assignees && task.assignees.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-xs text-stone-400">
            <i className="fa fa-user mr-1"></i>
            {task.creatorName || "—"}
          </div>
          <div className="flex flex-wrap justify-end gap-1">
            {task.assignees.map((assignee, i) => {
              const colors = generateAvatarColor(assignee.name);
              return (
                <span
                  key={i}
                  style={{
                    backgroundColor: colors.backgroundColor,
                    color: colors.color,
                  }}
                  className="border-oc-outline-light/60 rounded-full border px-1.5 py-0.5 text-xs font-bold whitespace-nowrap"
                  title={assignee.name}
                >
                  {assignee.name.slice(0, 1)}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
