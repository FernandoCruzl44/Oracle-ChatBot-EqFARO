// app/components/SprintTransitionModal.tsx
import { useEffect, useState } from "react";
import type { Sprint } from "~/types";
import useTaskStore from "~/store";
import Portal from "../../Portal";

interface SprintTransitionModalProps {
  sprint: Sprint;
  onClose: () => void;
  onComplete: (
    action: "moveToBacklog" | "moveToNextSprint",
    nextSprintId?: number,
  ) => void;
}

export function SprintTransitionModal({
  sprint,
  onClose,
  onComplete,
}: SprintTransitionModalProps) {
  const [selectedAction, setSelectedAction] = useState<
    "moveToBacklog" | "moveToNextSprint"
  >("moveToBacklog");
  const [nextSprintId, setNextSprintId] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { sprints } = useTaskStore();

  useEffect(() => {
    setIsVisible(true);
    // Pre-select the next sprint if available
    const upcomingSprints = sprints.filter(
      (s) =>
        s.teamId === sprint.teamId &&
        new Date(s.startDate) > new Date(sprint.endDate),
    );
    if (upcomingSprints.length > 0) {
      setNextSprintId(upcomingSprints[0].id);
    }
  }, [sprint, sprints]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 150);
  };

  const handleSubmit = () => {
    onComplete(
      selectedAction,
      selectedAction === "moveToNextSprint" && nextSprintId
        ? nextSprintId
        : undefined,
    );
    handleClose();
  };

  const futureSprints = sprints.filter(
    (s) =>
      s.teamId === sprint.teamId &&
      new Date(s.startDate) > new Date(sprint.endDate),
  );

  return (
    <Portal>
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 transition-opacity duration-150 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      >
        <div
          className={`w-full max-w-md rounded-lg bg-white p-6 transition-transform duration-150 ${
            isVisible ? "translate-y-0" : "translate-y-3"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="mb-4 text-xl font-bold">
            Completar Sprint: {sprint.name}
          </h2>

          <div className="mb-6 space-y-4">
            <div>
              <p className="mb-2 text-sm text-stone-600">
                Hay tareas incompletas en este sprint. ¿Qué deseas hacer con
                ellas?
              </p>

              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={selectedAction === "moveToBacklog"}
                    onChange={() => setSelectedAction("moveToBacklog")}
                    className="form-radio"
                  />
                  <span>Mover al backlog</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={selectedAction === "moveToNextSprint"}
                    onChange={() => setSelectedAction("moveToNextSprint")}
                    className="form-radio"
                  />
                  <span>Mover al siguiente sprint</span>
                </label>
              </div>
            </div>

            {selectedAction === "moveToNextSprint" && (
              <div className="ml-6">
                {futureSprints.length > 0 ? (
                  <select
                    value={nextSprintId || ""}
                    onChange={(e) => setNextSprintId(Number(e.target.value))}
                    className="w-full rounded border p-2"
                  >
                    {futureSprints.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({new Date(s.startDate).toLocaleDateString()} -{" "}
                        {new Date(s.endDate).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-yellow-600">
                    No hay sprints futuros disponibles para este equipo.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <button
              onClick={handleClose}
              className="rounded border px-4 py-2 hover:bg-stone-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedAction === "moveToNextSprint" && !nextSprintId}
              className={`rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 ${
                selectedAction === "moveToNextSprint" && !nextSprintId
                  ? "cursor-not-allowed opacity-50"
                  : ""
              }`}
            >
              Completar Sprint
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
