// app/components/Tasks/KanbanDnd.tsx
import React from "react";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "~/types";
import { TaskCard } from "./TaskCard";

// Draggable Task Component
export function DraggableTask({
  task,
  onClick,
  onSelect,
  isSelected,
  showAssignees,
  sprints,
  isUpdating,
}: {
  task: Task;
  onClick: () => void;
  onSelect: () => void;
  isSelected: boolean;
  showAssignees: boolean;
  sprints: any[];
  isUpdating?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `task-${task.id}`,
      data: { task },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard
        task={task}
        onClick={onClick}
        onSelect={onSelect}
        isSelected={isSelected}
        showAssignees={showAssignees}
        sprints={sprints}
        isDragging={isDragging}
        isUpdating={isUpdating}
      />
    </div>
  );
}

// Droppable Column Component
export function DroppableColumn({
  status,
  children,
  className,
}: {
  status: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
    data: { status },
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? "bg-stone-700/20" : ""}`}
    >
      {children}
    </div>
  );
}

// Main DnD Context Provider
export function KanbanDndProvider({
  children,
  onDragEnd,
  renderOverlay,
}: {
  children: React.ReactNode;
  onDragEnd: (taskId: number, newStatus: string) => void;
  renderOverlay: (task: Task | null) => React.ReactNode;
}) {
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const { task } = active.data.current as { task: Task };
    setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over) {
      const taskId = parseInt(active.id.toString().replace("task-", ""));
      const newStatus = (over.data.current as { status: string }).status;

      // Apply optimistic update immediately
      onDragEnd(taskId, newStatus);
    }

    setActiveTask(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
      <DragOverlay>{renderOverlay(activeTask)}</DragOverlay>
    </DndContext>
  );
}
