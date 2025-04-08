// app/components/Tasks/Pagination.tsx
import React from "react";

interface PaginationProps {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  selectedTasks: number[];
  filteredTasks: any[];
  tasksPerPage: number;
  isLoadingTasks: boolean;
  viewMode?: "table" | "kanban";
}

export function Pagination({
  currentPage,
  setCurrentPage,
  totalPages,
  selectedTasks,
  filteredTasks,
  tasksPerPage,
  isLoadingTasks,
  viewMode = "table",
}: PaginationProps) {
  if (viewMode === "kanban" && filteredTasks.length <= 100) {
    return (
      <div className="flex h-12 flex-shrink-0 items-center justify-between px-4 py-2 text-sm text-white/50">
        <div>
          {selectedTasks.length} seleccionada
          {selectedTasks.length !== 1 ? "s" : ""}
        </div>
        <div>
          Total: {filteredTasks.length} tarea
          {filteredTasks.length !== 1 ? "s" : ""}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-12 flex-shrink-0 items-center justify-between px-4 py-2 text-sm text-white/50">
      <div>
        {selectedTasks.length} seleccionada
        {selectedTasks.length !== 1 ? "s" : ""}
      </div>
      <div className="flex items-center">
        <span className="mr-4">
          Página {filteredTasks.length > 0 ? currentPage : 0} de {totalPages}
        </span>
        <span className="mr-4">{tasksPerPage} tareas por página</span>
        <div className="flex">
          <button
            className="border-oc-outline-light flex h-8 w-8 items-center justify-center rounded-l border disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => setCurrentPage(1)}
            disabled={
              currentPage === 1 || filteredTasks.length === 0 || isLoadingTasks
            }
          >
            <i className="fa fa-angle-double-left"></i>
          </button>
          <button
            className="border-oc-outline-light flex h-8 w-8 items-center justify-center border-t border-r border-b disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={
              currentPage === 1 || filteredTasks.length === 0 || isLoadingTasks
            }
          >
            <i className="fa fa-angle-left"></i>
          </button>
          <button
            className="border-oc-outline-light flex h-8 w-8 items-center justify-center border-t border-b disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={
              currentPage === totalPages ||
              filteredTasks.length === 0 ||
              isLoadingTasks
            }
          >
            <i className="fa fa-angle-right"></i>
          </button>
          <button
            className="border-oc-outline-light flex h-8 w-8 items-center justify-center rounded-r border disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => setCurrentPage(totalPages)}
            disabled={
              currentPage === totalPages ||
              filteredTasks.length === 0 ||
              isLoadingTasks
            }
          >
            <i className="fa fa-angle-double-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
