import React, { useState } from "react";
import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";
import { KanbanDndProvider } from "./KanbanDnd";
import KanbanSkeletonLoader from "~/components/Skeletons/KanbanSkeletonLoader";
import type { Task } from "~/types";

interface KanbanBoardProps {
  tasks: Task[];
  isLoadingTasks: boolean;
  error: string | null;
  searchTerm: string;
  handleSelectAll: () => void;
  selectedTasks: number[];
  handleTaskSelection: (taskId: number) => void;
  handleTaskClick: (task: Task) => void;
  handleStatusChange: (
    taskId: number,
    newStatus: string,
    taskData: Partial<Task>,
  ) => Promise<void>;
  showAssigneesColumn: boolean;
  sprints: any[];
}

export function KanbanBoard({
  tasks,
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

  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
  const [pendingUpdates, setPendingUpdates] = useState<Record<number, boolean>>(
    {},
  );

  React.useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const handleDragEnd = (taskId: number, newStatus: string) => {
    const taskIndex = localTasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return;

    const task = localTasks[taskIndex];
    if (task.status === newStatus) return;

    const updatedTasks = [...localTasks];
    updatedTasks[taskIndex] = { ...task, status: newStatus };
    setLocalTasks(updatedTasks);

    setPendingUpdates((prev) => ({ ...prev, [taskId]: true }));

    handleStatusChange(taskId, newStatus, task)
      .then(() => {
        setPendingUpdates((prev) => {
          const newState = { ...prev };
          delete newState[taskId];
          return newState;
        });
      })
      .catch((error) => {
        console.error("Failed to update task status:", error);
        setLocalTasks(tasks);
        setPendingUpdates((prev) => {
          const newState = { ...prev };
          delete newState[taskId];
          return newState;
        });
      });
  };

  const tasksByStatus = statuses.reduce<Record<string, Task[]>>(
    (acc, status) => {
      acc[status] = localTasks.filter(
        (task) =>
          task.status === status || (!task.status && status === "En progreso"),
      );
      return acc;
    },
    {},
  );

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

  if (isLoadingTasks) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-full w-full">
          <KanbanSkeletonLoader columns={4} cardsPerColumn={5} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center text-red-500">
        <div className="flex items-center">
          <i className="fa fa-exclamation-circle mr-2"></i>
          {error}
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-stone-500">
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
    <div className="flex flex-1 flex-col overflow-hidden">
      <KanbanDndProvider
        onDragEnd={handleDragEnd}
        renderOverlay={renderOverlay}
      >
        <div className="flex flex-1 overflow-x-auto">
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
