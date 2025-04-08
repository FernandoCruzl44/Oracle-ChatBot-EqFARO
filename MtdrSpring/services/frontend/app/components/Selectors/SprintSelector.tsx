import { useState, useEffect, useRef } from "react";
import type { Sprint, User } from "~/types";
import useTaskStore from "~/store";
import { EditSprintModal } from "../Modals/Sprint/EditSprintModal";

interface SprintSelectorProps {
  user: User | null;
  teamId: number | undefined;
  selectedSprintId: number | null;
  onSelectSprint: (sprintId: number | null) => void;
  onCreateSprint: () => void;
  isLoading: boolean;
  teams?: any[];
}

export function SprintSelector({
  user,
  teamId,
  selectedSprintId,
  onSelectSprint,
  onCreateSprint,
  isLoading,
  teams = [],
}: SprintSelectorProps) {
  const { sprints, getSprintsByTeam, fetchSprints } = useTaskStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isManager = user?.role === "manager";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const teamSprints =
    teamId === undefined
      ? sprints.sort((a, b) => a.name.localeCompare(b.name))
      : getSprintsByTeam(teamId).sort((a, b) => a.name.localeCompare(b.name));

  const currentSprint = sprints.find((s) => s.id === selectedSprintId);

  const getTeamNameById = (teamId: number) => {
    const team = teams.find((t) => t.id === teamId);
    return team ? team.name : null;
  };

  const handleEditSprint = (sprint: Sprint) => {
    setSelectedSprint(sprint);
    setIsEditModalOpen(true);
    setIsOpen(false);
  };

  const handleSaveSprint = () => {
    if (isManager && teamId === undefined) {
      console.log("Manager saved sprint - fetching all sprints");
      fetchSprints(undefined);
    } else if (teamId !== undefined) {
      console.log(`Fetching sprints for team ${teamId}`);
      fetchSprints(teamId);
    } else if (selectedSprint && selectedSprint.teamId) {
      console.log(
        `Fetching sprints for sprint's team ${selectedSprint.teamId}`,
      );
      fetchSprints(selectedSprint.teamId);
    }

    setIsEditModalOpen(false);
  };

  const handleDeleteSprint = () => {
    onSelectSprint(null);

    if (isManager && teamId === undefined) {
      console.log("Manager deleted sprint - fetching all sprints");
      fetchSprints(undefined);
    } else if (teamId !== undefined) {
      console.log(`Fetching sprints for team ${teamId}`);
      fetchSprints(teamId);
    } else if (selectedSprint && selectedSprint.teamId) {
      console.log(
        `Fetching sprints for sprint's team ${selectedSprint.teamId}`,
      );
      fetchSprints(selectedSprint.teamId);
    }

    setIsEditModalOpen(false);
  };

  const buttonClasses = `px-4 py-2 rounded-lg border border-oc-outline-light flex items-center text-sm ${
    isLoading ? "opacity-50 cursor-not-allowed" : ""
  }`;

  return (
    <div className="relative z-20" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${buttonClasses} bg-oc-primary text-white hover:bg-black`}
        disabled={isLoading}
      >
        <i className="fa fa-alarm-clock mr-2"></i>
        <span>
          {isLoading
            ? "Cargando sprints..."
            : currentSprint
              ? currentSprint.name +
                (teamId === undefined &&
                currentSprint.teamId &&
                getTeamNameById(currentSprint.teamId)
                  ? ` (${getTeamNameById(currentSprint.teamId)})`
                  : "")
              : teamSprints.length > 0
                ? "Todos los sprints"
                : "No hay sprints"}
        </span>
        <i
          className={`fa fa-chevron-down ml-2 text-xs transition-transform ${
            isOpen ? "rotate-180 transform" : ""
          }`}
        ></i>
      </button>

      {isOpen && (
        <div className="bg-oc-primary border-oc-outline-light absolute z-10 mt-1 w-56 rounded-lg border shadow-lg dark:border-stone-600">
          <div className="space-y-1 px-1 py-1">
            <button
              onClick={() => {
                onSelectSprint(null);
                setIsOpen(false);
              }}
              className={`w-full rounded px-4 py-2 text-left text-sm ${
                !selectedSprintId
                  ? "bg-stone-700 text-blue-400"
                  : "text-white hover:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-600"
              }`}
            >
              Todos los sprints
            </button>

            {teamSprints.map((sprint) => (
              <div
                key={sprint.id}
                className={`group flex items-center justify-between rounded ${
                  selectedSprintId === sprint.id
                    ? "bg-stone-700"
                    : "hover:bg-stone-700 dark:hover:bg-stone-600"
                }`}
              >
                <button
                  onClick={() => {
                    onSelectSprint(sprint.id);
                    setIsOpen(false);
                  }}
                  className={`block w-full px-4 py-2 text-left text-sm ${
                    selectedSprintId === sprint.id
                      ? "text-blue-400"
                      : "text-white dark:text-stone-400"
                  }`}
                >
                  {sprint.name}
                  {teamId === undefined &&
                    sprint.teamId &&
                    getTeamNameById(sprint.teamId) && (
                      <span className="ml-2 text-xs text-stone-500">
                        ({getTeamNameById(sprint.teamId)})
                      </span>
                    )}
                </button>
                {isManager && (
                  <button
                    onClick={() => handleEditSprint(sprint)}
                    className="translate-y-1 pr-2 text-stone-900 opacity-0 group-hover:opacity-100 hover:text-stone-600 dark:text-stone-400 dark:hover:text-stone-500"
                    title="Editar sprint"
                  >
                    <i className="fa fa-edit text-sm"></i>
                  </button>
                )}
              </div>
            ))}
            {isManager && (
              <div className="border-oc-outline-light/60 mt-1 border-t pt-1 dark:border-stone-600">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onCreateSprint();
                  }}
                  className="block w-full rounded px-4 py-2 text-left text-sm text-stone-700 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-600"
                >
                  <i className="fa fa-plus mr-2"></i>
                  Nuevo sprint
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedSprint && isEditModalOpen && (
        <EditSprintModal
          sprint={selectedSprint}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveSprint}
          onDelete={handleDeleteSprint}
        />
      )}
    </div>
  );
}
