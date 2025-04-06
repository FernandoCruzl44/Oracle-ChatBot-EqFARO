// app/components/Tasks/KanbanColumn.tsx
import React from "react";
import type { Task } from "~/types";
import { TaskCard } from "./TaskCard";
import { DraggableTask, DroppableColumn } from "./KanbanDnd";

interface KanbanColumnProps {
  status: string;
  tasks: Task[];
  onDragEnd: (taskId: number, newStatus: string) => void;
  handleTaskClick: (task: Task) => void;
  handleTaskSelection: (taskId: number) => void;
  selectedTasks: number[];
  showAssigneesColumn: boolean;
  sprints: any[];
  handleSelectAll: () => void;
  pendingUpdates?: Record<number, boolean>;
}

export function KanbanColumn({
  status,
  tasks,
  onDragEnd,
  handleTaskClick,
  handleTaskSelection,
  selectedTasks,
  showAssigneesColumn,
  sprints,
  handleSelectAll,
  pendingUpdates = {},
}: KanbanColumnProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completada":
        return "bg-green-900";
      case "En progreso":
        return "bg-blue-900";
      case "Cancelada":
        return "bg-red-900"; // Changed from red to stone
      case "Backlog":
        return "bg-yellow-900"; // Changed from yellow to stone
      default:
        return "bg-stone-900";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const allTasksInColumnSelected =
    tasks.length > 0 && tasks.every((task) => selectedTasks.includes(task.id));

  // Handle select all for this column
  const handleSelectAllInColumn = () => {
    const taskIdsInColumn = tasks.map((task) => task.id);

    // If all tasks in this column are selected, deselect them
    // Otherwise, add all unselected tasks to the selection
    if (allTasksInColumnSelected) {
      // Since we can't directly modify selectedTasks (it's controlled by the parent),
      // we'll simulate deselecting by calling handleTaskSelection for each task
      taskIdsInColumn.forEach((id) => {
        if (selectedTasks.includes(id)) {
          handleTaskSelection(id);
        }
      });
    } else {
      // Add all unselected tasks to the selection
      taskIdsInColumn.forEach((id) => {
        if (!selectedTasks.includes(id)) {
          handleTaskSelection(id);
        }
      });
    }
  };

  return (
    <div className="flex-1 min-w-64 flex flex-col h-full border-r border-oc-outline-light/60 last:border-r-0">
      <div
        className={`px-4 py-3 font-medium border-b
          border-oc-outline-light/60 flex justify-between items-center sticky top-0 z-10`}
      >
        <div className="flex items-center">
          <span>{status}</span>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-xs w-6 h-6 flex items-center justify-center rounded-full ${getStatusColor(
              status
            )} `}
          >
            {tasks.length}
          </span>
          <input
            type="checkbox"
            className="w-4 h-4 mr-[4px]"
            onChange={handleSelectAllInColumn}
            checked={tasks.length > 0 && allTasksInColumnSelected}
            disabled={tasks.length === 0}
          />
        </div>
      </div>
      <DroppableColumn
        status={status}
        className="flex-1 overflow-y-auto p-2 space-y-2"
      >
        {tasks.map((task) => (
          <DraggableTask
            key={task.id}
            task={task}
            onClick={() => handleTaskClick(task)}
            onSelect={() => handleTaskSelection(task.id)}
            isSelected={selectedTasks.includes(task.id)}
            showAssignees={showAssigneesColumn}
            sprints={sprints}
            isUpdating={pendingUpdates[task.id]}
          />
        ))}
      </DroppableColumn>
    </div>
  );
}
