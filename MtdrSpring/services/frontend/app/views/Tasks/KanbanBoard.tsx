// app/components/Tasks/KanbanBoard.tsx
import React, { useState } from "react";
import TasksSkeletonLoader from "~/components/Skeletons/TasksSkeletonLoader";
import { formatDate, getSprintName, generateAvatarColor } from "~/lib/utils";
import type { Task } from "~/types";
import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";
import { KanbanDndProvider } from "./KanbanDnd";
import KanbanSkeletonLoader from "~/components/Skeletons/KanbanSkeletonLoader";

interface KanbanBoardProps {
  paginatedTasks: Task[];
  isLoadingTasks: boolean;
  error: string | null;
  searchTerm: string;
  handleSelectAll: () => void;
  selectedTasks: number[];
  handleTaskSelection: (taskId: number) => void;
  handleTaskClick: (task: Task) => void;
  handleStatusChange: (taskId: number, newStatus: string) => Promise<void>;
  showAssigneesColumn: boolean;
  sprints: any[];
  tasksPerPage: number;
}

export function KanbanBoard({
  paginatedTasks,
  isLoadingTasks,
  error,
  searchTerm,
  handleSelectAll,
  selectedTasks,
  handleTaskSelection,
  handleTaskClick,
  handleStatusChange,
  showAssigneesColumn,
  sprints,
}: KanbanBoardProps) {
  const statuses = ["Backlog", "En progreso", "Completada", "Cancelada"];

  // Local state for optimistic updates
  const [localTasks, setLocalTasks] = useState<Task[]>(paginatedTasks);
  // Track tasks with pending status updates
  const [pendingUpdates, setPendingUpdates] = useState<Record<number, boolean>>(
    {}
  );

  // Update local tasks when paginatedTasks changes
  React.useEffect(() => {
    setLocalTasks(paginatedTasks);
  }, [paginatedTasks]);

  const handleDragEnd = (taskId: number, newStatus: string) => {
    // Find the task in local state
    const taskIndex = localTasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return;

    const task = localTasks[taskIndex];
    if (task.status === newStatus) return; // No change needed

    // Optimistically update local state
    const updatedTasks = [...localTasks];
    updatedTasks[taskIndex] = { ...task, status: newStatus };
    setLocalTasks(updatedTasks);

    // Mark task as updating
    setPendingUpdates((prev) => ({ ...prev, [taskId]: true }));

    // Then update server state
    handleStatusChange(taskId, newStatus)
      .then(() => {
        setPendingUpdates((prev) => {
          const newState = { ...prev };
          delete newState[taskId];
          return newState;
        });
      })
      .catch((error) => {
        // If the server update fails, revert to the previous state
        console.error("Failed to update task status:", error);
        setLocalTasks(paginatedTasks);
        setPendingUpdates((prev) => {
          const newState = { ...prev };
          delete newState[taskId];
          return newState;
        });
      });
  };

  // Group tasks by status using localTasks instead of paginatedTasks
  const tasksByStatus = statuses.reduce<Record<string, Task[]>>(
    (acc, status) => {
      acc[status] = localTasks.filter(
        (task) =>
          task.status === status ||
          // If status is empty, default to "En progreso"
          (!task.status && status === "En progreso")
      );
      return acc;
    },
    {}
  );

  // Render overlay for dragging
  const renderOverlay = (task: Task | null) => {
    if (!task) return null;

    return (
      <TaskCard
        task={task}
        onClick={() => {}}
        onSelect={() => {}}
        isSelected={selectedTasks.includes(task.id)}
        showAssignees={showAssigneesColumn}
        sprints={sprints}
        isDragging={true}
      />
    );
  };

  // We'll remove the select all header since we're moving it to each column

  if (isLoadingTasks) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full h-full">
          <KanbanSkeletonLoader columns={4} cardsPerColumn={5} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-500">
        <div className="flex items-center">
          <i className="fa fa-exclamation-circle mr-2"></i>
          {error}
        </div>
      </div>
    );
  }

  if (paginatedTasks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-stone-500">
        <div className="flex items-center">
          <i className="fa fa-info-circle mr-2"></i>
          {searchTerm
            ? "No hay tareas que coincidan con la búsqueda"
            : "No hay tareas para mostrar"}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <KanbanDndProvider
        onDragEnd={handleDragEnd}
        renderOverlay={renderOverlay}
      >
        <div className="flex-1 flex overflow-x-auto">
          {statuses.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasksByStatus[status] || []}
              onDragEnd={handleDragEnd}
              handleTaskClick={handleTaskClick}
              handleTaskSelection={handleTaskSelection}
              selectedTasks={selectedTasks}
              showAssigneesColumn={showAssigneesColumn}
              sprints={sprints}
              handleSelectAll={handleSelectAll}
              pendingUpdates={pendingUpdates}
            />
          ))}
        </div>
      </KanbanDndProvider>
    </div>
  );
}
