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

  const isFolded = typeof foldedColumns[status] === "boolean" ? foldedColumns[status] : false;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completada":
        return "bg-green-900";
      case "En progreso":
        return "bg-blue-900";
      case "Cancelada":
        return "bg-red-900";
      case "Backlog":
        return "bg-yellow-900";
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
      className={`flex-col border-r border-oc-outline-light/60 last:border-r-0 transition-discrete duration-100 ease-out overflow-clip ${
        isFolded ? "w-12" : "flex flex-1 min-w-64 h-full"
      }`}
    >
      <div
        className={`px-4 py-3 font-medium border-b border-oc-outline-light/60 flex justify-between items-center sticky top-0 z-10 ${
          isFolded ? "flex-col items-center" : "flex-row"
        }`}
      >
        <div className="flex items-center">
          {!isFolded && <span className="mr-2">{status}</span>}
          <button
            onClick={handleToggleFold}
            className="text-xs rounded p-1 focus:outline-none hover:bg-oc-amber/20 hover:text-oc-amber transition-colors group"
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
              className={`text-xs w-6 h-6 flex items-center justify-center rounded-full ${getStatusColor(
                status
              )} `}
            >
              {tasks.length}
            </span>
            <input
              type="checkbox"
              className="w-4 h-4 mr-[5px]"
              onChange={handleSelectAllInColumn}
              checked={tasks.length > 0 && allTasksInColumnSelected}
              disabled={tasks.length === 0}
            />
          </div>
        )}
      </div>
      {isFolded && (
        <div className="flex justify-center w-full h-full">
          <div className="mt-3 text-base w-6 h-6 flex items-center justify-center rounded-full">
            {tasks.length}
          </div>
        </div>
      )}
      <DroppableColumn
        status={status}
        className={`flex-1 overflow-y-auto p-2 space-y-2 transition-opacity duration-100 ${
          isFolded ? "opacity-0 pointer-events-none" : "opacity-100"
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
