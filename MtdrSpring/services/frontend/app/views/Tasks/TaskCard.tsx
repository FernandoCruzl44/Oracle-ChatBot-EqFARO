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
      className={`p-3 bg-oc-primary border border-oc-outline-light rounded-lg cursor-pointer hover:bg-stone-700/30 transition-colors ${
        isSelected ? "border-blue-500" : ""
      } ${isDragging ? "opacity-50" : ""} ${isUpdating ? "animate-pulse" : ""}`}
      onClick={handleClick}
    >
      <div className="flex justify-between items-start mb-2">
        <h3
          className="text-white font-medium text-sm truncate flex-1"
          title={task.title}
        >
          {task.title}
        </h3>
        <input
          type="checkbox"
          className="w-4 h-4 ml-2 flex-shrink-0"
          checked={isSelected}
          onChange={() => {}}
          onClick={handleCheckboxClick}
        />
      </div>

      <div className="flex items-center justify-between mb-2">
        <span
          className={`px-2 py-0.5 text-xs rounded-md border ${
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

      <div className="flex justify-between text-xs text-stone-400 mb-2">
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
        <div className="flex justify-between items-center">
          <div className="text-xs text-stone-400">
            <i className="fa fa-user mr-1"></i>
            {task.creatorName || "—"}
          </div>
          <div className="flex flex-wrap gap-1 justify-end">
            {task.assignees.map((assignee, i) => {
              const colors = generateAvatarColor(assignee.name);
              return (
                <span
                  key={i}
                  style={{
                    backgroundColor: colors.backgroundColor,
                    color: colors.color,
                  }}
                  className="px-1.5 py-0.5 text-xs rounded-full border border-oc-outline-light/60 whitespace-nowrap font-bold"
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
