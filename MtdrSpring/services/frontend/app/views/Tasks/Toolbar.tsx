// app/components/Tasks/Toolbar.tsx
import React from "react";
import { SprintSelector } from "~/components/Selectors/SprintSelector";
import useTaskStore from "~/store";

interface ToolbarProps {
  searchTerm: string;
  handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setSearchTerm: (value: string) => void;
  setCurrentPage: (value: number) => void;
  handleAddTaskClick: () => void;
  showSprintSelector: boolean;
  selectorTeamId: number | undefined;
  selectedSprintId: number | null;
  selectSprint: (sprintId: number | null) => void;
  isManager: boolean;
  setIsCreateSprintModalOpen: (value: boolean) => void;
  isLoadingSprints: boolean;
  selectedTasks: number[];
  handleDeleteTasks: () => void;
  isLoadingTasks: boolean;
  viewMode: "table" | "kanban";
  setViewMode: (mode: "table" | "kanban") => void;
}

export function Toolbar({
  searchTerm,
  handleSearch,
  setSearchTerm,
  setCurrentPage,
  handleAddTaskClick,
  showSprintSelector,
  selectorTeamId,
  selectedSprintId,
  selectSprint,
  isManager,
  setIsCreateSprintModalOpen,
  isLoadingSprints,
  selectedTasks,
  handleDeleteTasks,
  isLoadingTasks,
  viewMode,
  setViewMode,
}: ToolbarProps) {
  const currentUser = useTaskStore((state) => state.currentUser);

  return (
    <div className="py-4 flex items-center justify-between">
      <div className="flex flex-row gap-2 items-center">
        <div className="relative w-72">
          <input
            type="text"
            placeholder="Buscar por título"
            className="w-full pl-8 pr-10 py-2 rounded-lg border border-oc-outline-light text-white bg-oc-primary text-sm"
            value={searchTerm}
            onChange={handleSearch}
            disabled={isLoadingTasks}
          />
          <i className="fa fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-white"></i>
          {searchTerm && (
            <i
              className="fa fa-times-circle absolute right-3 top-1/2 transform -translate-y-1/2 text-oc-brown/80 cursor-pointer"
              onClick={() => {
                setSearchTerm("");
                setCurrentPage(1);
              }}
            ></i>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAddTaskClick}
            className={`px-4 py-2 bg-oc-primary hover:bg-black rounded-lg border border-oc-outline-light flex items-center text-white text-sm ${
              isLoadingTasks ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isLoadingTasks}
          >
            <i className="fa fa-plus mr-2"></i>
            <span>Agrega tarea</span>
          </button>

          {/* View Toggle Buttons */}
          <div className="flex rounded-lg border border-oc-outline-light overflow-hidden">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-2 flex items-center text-sm ${
                viewMode === "kanban"
                  ? "bg-stone-700 text-white"
                  : "bg-oc-primary text-stone-400 hover:text-white hover:bg-black"
              }`}
              title="Vista de kanban"
            >
              <i className="fa fa-columns"></i>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-2 flex items-center text-sm ${
                viewMode === "table"
                  ? "bg-stone-700 text-white"
                  : "bg-oc-primary text-stone-400 hover:text-white hover:bg-black"
              }`}
              title="Vista de tabla"
            >
              <i className="fa fa-table"></i>
            </button>
          </div>

          {showSprintSelector && (
            <SprintSelector
              teamId={
                isManager
                  ? (selectorTeamId as number)
                  : (currentUser?.teamId as number)
              }
              selectedSprintId={selectedSprintId}
              onSelectSprint={selectSprint}
              onCreateSprint={
                isManager ? () => setIsCreateSprintModalOpen(true) : () => {}
              }
              isLoading={isLoadingSprints}
            />
          )}

          {selectedTasks.length > 0 && (
            <button
              onClick={handleDeleteTasks}
              className="px-4 py-2 hover:bg-red-900/50 rounded-lg border border-red-400 flex items-center text-red-400 text-sm transition-colors"
            >
              <i className="fa fa-trash mr-2"></i>
              <span>Eliminar ({selectedTasks.length})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
