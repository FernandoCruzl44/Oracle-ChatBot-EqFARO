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
  viewMode: "table" | "kanban";
  setViewMode: (mode: "table" | "kanban") => void;
  selectedTasks: number[];
  handleDeleteTasks: () => void;
  isLoadingTasks: boolean;
  teams?: any[];
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
  viewMode,
  setViewMode,
  selectedTasks,
  handleDeleteTasks,
  isLoadingTasks,
  teams = [],
}: ToolbarProps) {
  const currentUser = useTaskStore((state) => state.currentUser);
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex flex-row items-center gap-2">
        <div className="relative w-72">
          <input
            type="text"
            placeholder="Buscar por título"
            className="border-oc-outline-light bg-oc-primary w-full rounded-lg border py-2 pr-10 pl-8 text-sm text-white"
            value={searchTerm}
            onChange={handleSearch}
            disabled={isLoadingTasks}
          />
          <i className="fa fa-search absolute top-1/2 left-3 -translate-y-1/2 transform text-white"></i>
          {searchTerm && (
            <i
              className="fa fa-times-circle text-oc-brown/80 absolute top-1/2 right-3 -translate-y-1/2 transform cursor-pointer"
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
            className={`bg-oc-primary border-oc-outline-light flex items-center rounded-lg border px-4 py-2 text-sm text-white hover:bg-black ${
              isLoadingTasks ? "cursor-not-allowed opacity-50" : ""
            }`}
            disabled={isLoadingTasks}
          >
            <i className="fa fa-plus mr-2"></i>
            <span>Agrega tarea</span>
          </button>

          <div className="border-oc-outline-light flex overflow-hidden rounded-lg border">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center px-3 py-2 text-sm ${
                viewMode === "kanban"
                  ? "bg-stone-700 text-white"
                  : "bg-oc-primary text-stone-400 hover:bg-black hover:text-white"
              }`}
              title="Vista de kanban"
            >
              <i className="fa fa-columns"></i>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center px-3 py-2 text-sm ${
                viewMode === "table"
                  ? "bg-stone-700 text-white"
                  : "bg-oc-primary text-stone-400 hover:bg-black hover:text-white"
              }`}
              title="Vista de tabla"
            >
              <i className="fa fa-table"></i>
            </button>
          </div>

          {showSprintSelector && (
            <SprintSelector
              isManager={isManager}
              user={currentUser}
              teamId={selectorTeamId}
              selectedSprintId={selectedSprintId}
              onSelectSprint={selectSprint}
              onCreateSprint={
                isManager ? () => setIsCreateSprintModalOpen(true) : () => {}
              }
              isLoading={isLoadingSprints}
              teams={teams}
            />
          )}

          {selectedTasks.length > 0 && (
            <button
              onClick={handleDeleteTasks}
              className="flex items-center rounded-lg border border-red-400 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-900/50"
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
