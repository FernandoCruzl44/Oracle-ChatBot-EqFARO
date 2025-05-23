// app/components/Tasks/TasksTable.tsx
import React from "react";
import TasksSkeletonLoader from "~/components/Skeletons/TasksSkeletonLoader";
import TaskStatusSelector from "~/components/Selectors/TaskStatusSelector";
import { formatDate, getSprintName, generateAvatarColor } from "~/lib/utils";
import type { Task } from "~/types";

interface TableProps {
  paginatedTasks: Task[];
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
  ) => void;
  showAssigneesColumn: boolean;
  sprints: any[];
  tasksPerPage: number;
}

export function Table({
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
  tasksPerPage,
}: TableProps) {
  const tableHeaders = [
    { id: "checkbox", label: "", width: "w-12 px-5" },
    { id: "title", label: "Título", width: "w-80" },
    { id: "tag", label: "Tag", width: "w-28" },
    { id: "sprint", label: "Sprint", width: "w-24" },
    { id: "status", label: "Estatus", width: "w-32" },
    { id: "startDate", label: "Fecha Inicio", width: "w-32" },
    { id: "endDate", label: "Fecha Final", width: "w-32" },
    { id: "creator", label: "Creada por", width: "w-32" },
  ];

  if (showAssigneesColumn) {
    tableHeaders.push({ id: "assignees", label: "Asignada a", width: "w-32" });
  }

  const columnCount = tableHeaders.length;

  return (
    <div className="flex-grow overflow-y-auto">
      <table className="min-w-full table-fixed text-white">
        <thead className="bg-oc-primary sticky top-0 z-10">
          <tr style={{ boxShadow: "0 1px 0px #343231" }}>
            {tableHeaders.map((header) => (
              <td
                key={header.id}
                className={`py-3 font-bold ${header.width} ${
                  header.id === "checkbox" ? "pl-5" : "px-2"
                }`}
              >
                {header.id === "checkbox" ? (
                  <input
                    type="checkbox"
                    className="h-4 w-4 translate-y-0.5"
                    onChange={handleSelectAll}
                    checked={
                      paginatedTasks.length > 0 &&
                      selectedTasks.length === paginatedTasks.length
                    }
                    disabled={isLoadingTasks || paginatedTasks.length === 0}
                  />
                ) : (
                  header.label
                )}
              </td>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoadingTasks ? (
            <TasksSkeletonLoader columns={columnCount} rows={tasksPerPage} />
          ) : error ? (
            <tr>
              <td
                colSpan={columnCount}
                className="px-6 py-4 text-center text-red-500"
              >
                <div className="flex items-center justify-center">
                  <i className="fa fa-exclamation-circle mr-2"></i>
                  {error}
                </div>
              </td>
            </tr>
          ) : paginatedTasks.length === 0 ? (
            <tr>
              <td
                colSpan={columnCount}
                className="px-6 py-4 text-center text-stone-500"
              >
                <div className="flex items-center justify-center">
                  <i className="fa fa-info-circle mr-2"></i>
                  {searchTerm
                    ? "No hay tareas que coincidan con la búsqueda"
                    : "No hay tareas para mostrar"}
                </div>
              </td>
            </tr>
          ) : (
            paginatedTasks.map((task, index) => (
              <tr
                key={task.id}
                className={`border-oc-outline-light/60 transition-colors hover:bg-stone-700/30 ${
                  index === paginatedTasks.length - 1 ? "" : "border-b"
                }`}
              >
                <td
                  className="w-12 translate-y-0.5 px-5 py-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={selectedTasks.includes(task.id)}
                    onChange={() => handleTaskSelection(task.id)}
                  />
                </td>
                <td
                  className="truncate px-2 py-3"
                  onClick={() => handleTaskClick(task)}
                >
                  <button
                    className="text-left hover:underline"
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault();
                      handleTaskClick(task);
                    }}
                    title={task.title}
                  >
                    {task.title}
                  </button>
                </td>
                <td className="px-2 py-2">
                  <span
                    className={`rounded-lg border px-2 py-1 text-xs ${
                      task.tag === "Feature"
                        ? "border-green-700/50 text-green-300"
                        : "border-red-700/50 text-red-300"
                    } inline-block w-auto text-center`}
                  >
                    {task.tag}
                  </span>
                </td>
                <td className="truncate px-2 py-3">
                  <span
                    className="text-sm"
                    title={getSprintName(sprints, task.sprintId)}
                  >
                    {getSprintName(sprints, task.sprintId)}
                  </span>
                </td>
                <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                  <TaskStatusSelector
                    status={task.status || "En progreso"}
                    onStatusChange={(newStatus) =>
                      handleStatusChange(task.id, newStatus, task)
                    }
                    isLoading={isLoadingTasks}
                  />
                </td>
                <td className="px-2 py-3">{formatDate(task.startDate)}</td>
                <td className="px-2 py-3">{formatDate(task.endDate)}</td>
                <td
                  className="truncate px-2 py-3"
                  title={task.creatorName || "—"}
                >
                  {task.creatorName || "—"}
                </td>
                {showAssigneesColumn ? (
                  <td className="px-2 py-3">
                    {task.assignees && task.assignees.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
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
                    ) : (
                      "—"
                    )}
                  </td>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
