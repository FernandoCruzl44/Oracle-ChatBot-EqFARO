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
  // No pagination si es kanban y hay menos de 100 tareas
  if (viewMode === "kanban" && filteredTasks.length <= 100) {
    return (
      <div className="px-4 py-2 flex items-center justify-between text-white/50 text-sm h-12 flex-shrink-0">
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
    <div className="px-4 py-2 flex items-center justify-between text-white/50 text-sm h-12 flex-shrink-0">
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
            className="w-8 h-8 flex items-center justify-center border rounded-l border-oc-outline-light disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setCurrentPage(1)}
            disabled={
              currentPage === 1 || filteredTasks.length === 0 || isLoadingTasks
            }
          >
            <i className="fa fa-angle-double-left"></i>
          </button>
          <button
            className="w-8 h-8 flex items-center justify-center border-t border-r border-b border-oc-outline-light disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={
              currentPage === 1 || filteredTasks.length === 0 || isLoadingTasks
            }
          >
            <i className="fa fa-angle-left"></i>
          </button>
          <button
            className="w-8 h-8 flex items-center justify-center border-t border-b border-oc-outline-light disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="w-8 h-8 flex items-center justify-center border rounded-r border-oc-outline-light disabled:opacity-50 disabled:cursor-not-allowed"
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
