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
  handleDeselectAll: () => void;
  handleDivideTasks?: () => void;
  handleMigrateTasks?: () => void;
  handleAIClick?: () => void;
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
  handleDeselectAll,
  handleDivideTasks,
  handleMigrateTasks,
  handleAIClick,
  isLoadingTasks,
  teams = [],
}: ToolbarProps) {
  const currentUser = useTaskStore((state) => state.currentUser);

  return (
    <div className="flex flex-wrap items-center justify-between gap-y-2 py-4">
      {/* Left Section */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-72">
          <input
            type="text"
            placeholder="Buscar por título"
            className="border-oc-outline-light bg-oc-primary w-full rounded-lg border py-2 pr-10 pl-8 text-sm text-white placeholder-stone-400"
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
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddTaskClick}
            className={`border-oc-outline-light bg-oc-primary flex flex-shrink-0 items-center rounded-lg border p-2 px-4 py-2 text-sm text-white hover:bg-black ${
              isLoadingTasks ? "cursor-not-allowed opacity-50" : ""
            }`}
            disabled={isLoadingTasks}
            title="Agregar tarea"
            aria-label="Agregar tarea"
          >
            <i className="fa fa-plus mr-2"></i>
            <span className="inline">Agregar tarea</span>
          </button>

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

          {handleMigrateTasks && (
            <button
              onClick={handleMigrateTasks}
              className={`border-oc-outline-light bg-oc-primary flex flex-shrink-0 items-center rounded-lg border p-2 text-sm text-white hover:bg-black 2xl:px-4 2xl:py-2 ${
                isLoadingTasks ? "cursor-not-allowed opacity-50" : ""
              }`}
              disabled={isLoadingTasks}
              title="Migrar"
              aria-label="Migrar"
            >
              <i className="fa fa-arrow-right 2xl:mr-2"></i>
              <span className="hidden 2xl:inline">Migrar</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            {handleAIClick && (
              <button
                onClick={handleAIClick}
                className={`border-oc-outline-light bg-oc-primary flex flex-shrink-0 items-center rounded-lg border p-2 text-sm text-white hover:bg-black 2xl:px-4 2xl:py-2 ${
                  isLoadingTasks ? "cursor-not-allowed opacity-50" : ""
                }`}
                disabled={isLoadingTasks}
                title="Asistente AI"
                aria-label="Asistente AI"
              >
                <i className="fa fa-robot 2xl:mr-2"></i>
                <span className="hidden 2xl:inline">Asistente AI</span>
              </button>
            )}
          </div>

          <div
            className="flex items-center gap-2"
            style={{
              opacity: selectedTasks.length > 0 ? 1 : 0,
              visibility: selectedTasks.length > 0 ? "visible" : "hidden",
              transition:
                "opacity 0.1s ease-in-out, visibility 0.1s ease-in-out",
              position: "relative",
            }}
          >
            {handleDivideTasks && (
              <button
                onClick={handleDivideTasks}
                className="flex flex-shrink-0 flex-row items-center rounded-lg border border-sky-400 p-2 text-sm text-sky-400 transition-colors hover:bg-sky-900/50 2xl:px-4 2xl:py-2"
                title={`Dividir (${selectedTasks.length})`}
                aria-label={`Dividir (${selectedTasks.length})`}
              >
                <i className="fa fa-sparkles 2xl:mr-2"></i>
                <span className="hidden 2xl:inline">
                  Dividir ({selectedTasks.length})
                </span>
              </button>
            )}
            <button
              onClick={handleDeleteTasks}
              className="flex flex-shrink-0 flex-row items-center rounded-lg border border-red-400 p-2 text-sm text-red-400 transition-colors hover:bg-red-900/50 2xl:px-4 2xl:py-2"
              title={`Eliminar (${selectedTasks.length})`}
              aria-label={`Eliminar (${selectedTasks.length})`}
            >
              <i className="fa fa-trash 2xl:mr-2"></i>
              <span className="hidden 2xl:inline">
                Eliminar ({selectedTasks.length})
              </span>
            </button>
            <button
              onClick={handleDeselectAll}
              className="flex flex-shrink-0 items-center rounded-lg border border-amber-400 p-2 text-sm text-amber-400 transition-colors hover:bg-amber-900/50 2xl:px-4 2xl:py-2"
              title="Deseleccionar todo"
              aria-label="Deseleccionar todo"
            >
              <i className="fa fa-times-circle 2xl:mr-2"></i>
              <span className="hidden 2xl:inline">Ninguno</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        <div className="border-oc-outline-light flex flex-shrink-0 overflow-hidden rounded-lg border">
          <button
            onClick={() => setViewMode("kanban")}
            className={`flex items-center p-2 text-sm 2xl:px-3 2xl:py-2 ${
              viewMode === "kanban"
                ? "bg-stone-700 text-white"
                : "bg-oc-primary text-stone-400 hover:bg-black hover:text-white"
            }`}
            title="Vista de kanban"
            aria-label="Vista de kanban"
          >
            <i className="fa fa-columns 2xl:mr-2"></i>
            <span className="hidden 2xl:inline">Kanban</span>
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center p-2 text-sm 2xl:px-3 2xl:py-2 ${
              viewMode === "table"
                ? "bg-stone-700 text-white"
                : "bg-oc-primary text-stone-400 hover:bg-black hover:text-white"
            }`}
            title="Vista de tabla"
            aria-label="Vista de tabla"
          >
            <i className="fa fa-table 2xl:mr-2"></i>
            <span className="hidden 2xl:inline">Tabla</span>
          </button>
        </div>
      </div>
    </div>
  );
}
