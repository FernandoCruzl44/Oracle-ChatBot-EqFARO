import useTaskStore from "~/store";
import { DraggableTask, DroppableColumn } from "./KanbanDnd";
import type { Task } from "~/types";

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
  handleTaskClick,
  handleTaskSelection,
  selectedTasks,
  showAssigneesColumn,
  sprints,
  pendingUpdates = {},
}: KanbanColumnProps) {
  const foldedColumns = useTaskStore((state) => state.foldedColumns);
  const toggleColumnFolded = useTaskStore((state) => state.toggleColumnFolded);

  const isFolded =
    typeof foldedColumns[status] === "boolean" ? foldedColumns[status] : false;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completada":
        return "bg-stone-900";
      case "En progreso":
        return "bg-stone-900";
      case "Cancelada":
        return "bg-stone-900";
      case "Backlog":
        return "bg-stone-900";
      default:
        return "bg-stone-900";
    }
  };

  const allTasksInColumnSelected =
    tasks.length > 0 && tasks.every((task) => selectedTasks.includes(task.id));

  const handleSelectAllInColumn = () => {
    const taskIdsInColumn = tasks.map((task) => task.id);

    if (allTasksInColumnSelected) {
      taskIdsInColumn.forEach((id) => {
        if (selectedTasks.includes(id)) {
          handleTaskSelection(id);
        }
      });
    } else {
      taskIdsInColumn.forEach((id) => {
        if (!selectedTasks.includes(id)) {
          handleTaskSelection(id);
        }
      });
    }
  };

  const handleToggleFold = () => {
    toggleColumnFolded(status);
  };

  return (
    <div
      className={`border-oc-outline-light/60 flex-col overflow-clip border-r transition-discrete duration-100 ease-out last:border-r-0 ${
        isFolded ? "w-12" : "flex h-full min-w-64 flex-1"
      }`}
    >
      <div
        className={`border-oc-outline-light/60 sticky top-0 z-10 flex items-center justify-between border-b px-4 py-3 font-medium ${
          isFolded ? "flex-col items-center" : "flex-row"
        }`}
      >
        <div className="flex items-center">
          {!isFolded && <span className="mr-2">{status}</span>}
          <button
            onClick={handleToggleFold}
            className="hover:bg-oc-amber/20 hover:text-oc-amber group rounded p-1 text-xs transition-colors focus:outline-none"
          >
            {isFolded ? (
              <span className="fa fa-expand rotate-45 transition-transform group-active:scale-80" />
            ) : (
              <span className="fa fa-compress rotate-45 transition-transform group-active:scale-80" />
            )}
          </button>
        </div>
        {!isFolded && (
          <div className="flex items-center gap-3">
            <span
              className={`outline-oc-outline-light flex h-6 w-6 items-center justify-center rounded-full text-xs outline ${getStatusColor(
                status,
              )} `}
            >
              {tasks.length}
            </span>
            <input
              type="checkbox"
              className="mr-[5px] h-4 w-4"
              onChange={handleSelectAllInColumn}
              checked={tasks.length > 0 && allTasksInColumnSelected}
              disabled={tasks.length === 0}
            />
          </div>
        )}
      </div>
      {isFolded && (
        <div className="flex h-full w-full justify-center">
          <div className="mt-3 flex h-6 w-6 items-center justify-center rounded-full text-base">
            {tasks.length}
          </div>
        </div>
      )}
      <DroppableColumn
        status={status}
        className={`flex-1 space-y-2 overflow-y-auto p-2 transition-opacity duration-100 ${
          isFolded ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
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
