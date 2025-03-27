// app/components/SprintSelector.tsx
import { useState, useEffect, useRef } from "react";
import type { Sprint } from "~/types";
import useTaskStore from "~/store";
import { EditSprintModal } from "./EditSprintModal";

interface SprintSelectorProps {
  teamId: number;
  selectedSprintId: number | null;
  onSelectSprint: (sprintId: number | null) => void;
  onCreateSprint: () => void;
  isLoading: boolean;
}

export function SprintSelector({
  teamId,
  selectedSprintId,
  onSelectSprint,
  onCreateSprint,
  isLoading,
}: SprintSelectorProps) {
  const { sprints, getSprintsByTeam, fetchSprints } = useTaskStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const teamSprints = getSprintsByTeam(teamId);
  const currentSprint = sprints.find((s) => s.id === selectedSprintId);

  const handleEditSprint = (sprint: Sprint) => {
    setSelectedSprint(sprint);
    setIsEditModalOpen(true);
    setIsOpen(false);
  };

  const handleSaveSprint = () => {
    fetchSprints(teamId); // Refresh the sprints list
    setIsEditModalOpen(false);
  };

  const handleDeleteSprint = () => {
    onSelectSprint(null); // Deselect the deleted sprint
    fetchSprints(teamId); // Refresh the sprints list
    setIsEditModalOpen(false);
  };

  return (
    <div className="relative z-20" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2 bg-oc-primary hover:bg-white rounded-lg border border-oc-outline-light flex items-center text-black text-sm ${
          isLoading ? "opacity-50 cursor-not-allowed" : ""
        }`}
        disabled={isLoading}
      >
        <i className="fa fa-alarm-clock mr-2"></i>
        <span>
          {currentSprint
            ? currentSprint.name
            : teamSprints.length > 0
            ? "Todos los sprints"
            : "No hay sprints"}
        </span>
        <i
          className={`fa fa-chevron-down ml-2 text-xs transition-transform ${
            isOpen ? "transform rotate-180" : ""
          }`}
        ></i>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-56 bg-white rounded-lg shadow-lg border border-oc-outline-light">
          <div className="py-1">
            <button
              onClick={() => {
                onSelectSprint(null);
                setIsOpen(false);
              }}
              className={`block w-full text-left px-4 py-2 text-sm ${
                !selectedSprintId
                  ? "bg-blue-50 text-blue-800"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Todos los sprints
            </button>

            {teamSprints.map((sprint) => (
              <div
                key={sprint.id}
                className={`group flex items-center justify-between ${
                  selectedSprintId === sprint.id
                    ? "bg-blue-50"
                    : "hover:bg-gray-100"
                }`}
              >
                <button
                  onClick={() => {
                    onSelectSprint(sprint.id);
                    setIsOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    selectedSprintId === sprint.id
                      ? "text-blue-800"
                      : "text-gray-700"
                  }`}
                >
                  {sprint.name}
                </button>
                <button
                  onClick={() => handleEditSprint(sprint)}
                  className="opacity-0 group-hover:opacity-100 pr-2 text-gray-400 hover:text-gray-600 translate-y-1"
                  title="Editar sprint"
                >
                  <i className="fa fa-edit text-sm"></i>
                </button>
              </div>
            ))}

            <div className="border-t border-oc-outline-light/60 mt-1 pt-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onCreateSprint();
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <i className="fa fa-plus mr-2"></i>
                Nuevo sprint
              </button>
            </div>
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
