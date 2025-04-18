import { useState, useEffect } from "react";
import type { Sprint, Task } from "~/types";
import useTaskStore from "~/store/index";
import { Modal } from "../../Modal";
import { Button } from "../../Button";
import { Card } from "../../Card";
import { FormField } from "../../FormField";
import { Select } from "../../Select";
import { Input } from "../../Input";

interface SprintMigrationModalProps {
  currentSprint: Sprint;
  onClose: () => void;
  preSelectedTaskIds?: number[];
}

export default function SprintMigrationModal({
  currentSprint,
  onClose,
  preSelectedTaskIds = [],
}: SprintMigrationModalProps) {
  const {
    tasks: allTasks,
    getTasksForSprint,
    sprints,
    getSprintsByTeam,
    assignTasksToSprint,
    removeTaskFromSprint,
    isLoadingSprintTasks,
    fetchSprintTasks,
    getTaskById,
    migrateTasksToSprint,
  } = useTaskStore();

  const [isVisible, setIsVisible] = useState(false);
  const [selectedTasks, setSelectedTasks] =
    useState<number[]>(preSelectedTaskIds);
  const [targetSprintId, setTargetSprintId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSearchTerm, setSelectedSearchTerm] = useState("");

  // Get tasks for current sprint
  const sprintTasks = getTasksForSprint(currentSprint.id);

  // Get preselected tasks that are not in the current sprint
  const preSelectedTasksFromOtherSprints = preSelectedTaskIds
    .filter((id) => !sprintTasks.some((task) => task.id === id))
    .map((id) => getTaskById(id))
    .filter((task) => task !== undefined) as Task[];

  // Filter available tasks based on search term and selection status
  const availableTasks = [
    ...sprintTasks,
    ...preSelectedTasksFromOtherSprints,
  ].filter(
    (task) =>
      !selectedTasks.includes(task.id) &&
      task.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Get tasks that are selected for migration
  const tasksForMigration = [
    ...sprintTasks,
    ...preSelectedTasksFromOtherSprints,
  ].filter(
    (task) =>
      selectedTasks.includes(task.id) &&
      task.title.toLowerCase().includes(selectedSearchTerm.toLowerCase()),
  );

  // Get available target sprints
  const teamSprints = getSprintsByTeam(currentSprint.teamId).filter(
    (sprint) =>
      sprint.id !== currentSprint.id &&
      (sprint.status === "PLANNED" || sprint.status === "ACTIVE"),
  );

  // Get the latest available sprint by start date
  const latestSprint = teamSprints.reduce(
    (latest, current) => {
      if (!latest) return current;
      return new Date(current.startDate) > new Date(latest.startDate)
        ? current
        : latest;
    },
    teamSprints.length > 0 ? teamSprints[0] : null,
  );

  // Effect to set initial visibility and default target sprint
  useEffect(() => {
    setTimeout(() => {
      setIsVisible(true);
    }, 0);

    // Load tasks for the current sprint if not already loaded
    fetchSprintTasks(currentSprint.id);

    // Set default target sprint to the latest available sprint
    if (latestSprint && !targetSprintId) {
      setTargetSprintId(latestSprint.id);
    }
  }, [currentSprint, fetchSprintTasks, latestSprint, targetSprintId]);

  // Handlers
  const handleClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsVisible(false);
    setTimeout(onClose, 150);
  };

  const handleAddTask = (taskId: number) => {
    if (!selectedTasks.includes(taskId)) {
      setSelectedTasks((prev) => [...prev, taskId]);
    }
  };

  const handleRemoveTask = (taskId: number) => {
    setSelectedTasks((prev) => prev.filter((id) => id !== taskId));
  };

  const handleSelectAllTasks = () => {
    const allTaskIds = [
      ...sprintTasks,
      ...preSelectedTasksFromOtherSprints,
    ].map((task) => task.id);
    setSelectedTasks(allTaskIds);
  };

  const handleClearSelection = () => {
    setSelectedTasks([]);
  };

  const handleMigrateTasks = async () => {
    if (!targetSprintId || selectedTasks.length === 0) {
      return;
    }
    setIsSubmitting(true);
    try {
      await migrateTasksToSprint(targetSprintId, selectedTasks);
      handleClose();
    } catch (error) {
      console.error("Error migrating tasks:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTaskSprintName = (task: Task) => {
    if (!task.sprintId) return "Sin sprint";
    const sprint = sprints.find((s) => s.id === task.sprintId);
    return sprint ? sprint.name : "Sprint desconocido";
  };

  return (
    <Modal
      className="max-h-[90vh] w-[1000px]"
      isVisible={isVisible}
      onClose={handleClose}
      handleClose={handleClose}
    >
      <div className="flex h-full w-full flex-col p-6">
        <h2 className="mb-4 text-xl font-bold text-white">Migrar Tareas</h2>

        <Card className="mb-4 p-4">
          <div className="flex items-center gap-2">
            <i className="fa fa-alarm-clock text-oc-text-gray"></i>
            <span className="text-oc-text-gray text-sm">Sprint de Destino</span>
            <Select
              value={targetSprintId?.toString() || ""}
              onChange={(e) =>
                setTargetSprintId(
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              options={[
                { value: "", label: "Seleccionar sprint" },
                ...teamSprints.map((sprint) => ({
                  value: sprint.id.toString(),
                  label: `${sprint.name}${sprint.id === latestSprint?.id ? " (Último)" : ""}`,
                })),
              ]}
            />
          </div>
        </Card>

        <div className="flex h-[550px] justify-between gap-4">
          {/* Available Tasks Column */}
          <Card className="flex flex-1 flex-col overflow-hidden">
            <div className="border-oc-outline-light/60 border-b p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-base font-medium text-white">
                  Tareas de Sprint Actual
                </h3>
                <button
                  type="button"
                  className="text-sm text-blue-400 hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={handleSelectAllTasks}
                  disabled={availableTasks.length === 0}
                >
                  Agregar Todas
                </button>
              </div>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  customClass="w-full pl-8 text-sm py-1"
                />
                <i className="fa fa-search text-oc-text-gray/60 absolute top-1/2 left-2.5 -translate-y-1/2"></i>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoadingSprintTasks ? (
                <div className="text-oc-text-gray flex h-full items-center justify-center p-4">
                  <i className="fa fa-spinner fa-spin mr-2"></i> Cargando...
                </div>
              ) : availableTasks.length === 0 ? (
                <div className="text-oc-text-gray p-4 text-center">
                  {searchTerm
                    ? "No hay coincidencias."
                    : "No hay tareas disponibles."}
                </div>
              ) : (
                <div className="divide-oc-outline-light/60 divide-y">
                  {availableTasks.map((task) => (
                    <div
                      key={task.id}
                      className="hover:bg-oc-neutral/20 flex items-center justify-between px-3 py-2"
                    >
                      <div className="mr-2 flex-1 overflow-hidden">
                        <div
                          className="truncate text-sm leading-tight font-medium"
                          title={task.title}
                        >
                          {task.title}
                        </div>
                        <div className="mt-1 flex space-x-1.5 text-xs">
                          <span className="bg-oc-neutral/30 text-oc-text-gray rounded px-1.5 py-0.5">
                            {task.status}
                          </span>
                          {task.sprintId !== currentSprint.id && (
                            <span className="truncate rounded bg-blue-900/50 px-1.5 py-0.5 text-blue-300">
                              Desde: {getTaskSprintName(task)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleAddTask(task.id)}
                        className="ml-2 w-[70px] flex-shrink-0 bg-green-700 px-2 py-1 text-center text-xs leading-none hover:bg-green-600"
                      >
                        Agregar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Selected Tasks Column */}
          <Card className="flex flex-1 flex-col overflow-hidden">
            <div className="border-oc-outline-light/60 border-b p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-base font-medium text-white">
                  Tareas a Migrar ({tasksForMigration.length})
                </h3>
                {tasksForMigration.length > 0 && (
                  <button
                    type="button"
                    className="text-sm text-red-400 hover:text-red-300"
                    onClick={handleClearSelection}
                  >
                    Quitar Todas
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Buscar..."
                  value={selectedSearchTerm}
                  onChange={(e) => setSelectedSearchTerm(e.target.value)}
                  customClass="w-full pl-8 text-sm py-1"
                />
                <i className="fa fa-search text-oc-text-gray/60 absolute top-1/2 left-2.5 -translate-y-1/2"></i>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {tasksForMigration.length === 0 ? (
                <div className="text-oc-text-gray p-4 text-center">
                  Agrega tareas desde la izquierda.
                </div>
              ) : (
                <div className="divide-oc-outline-light/60 divide-y">
                  {tasksForMigration.map((task) => (
                    <div
                      key={task.id}
                      className="hover:bg-oc-neutral/20 flex items-center justify-between px-3 py-2"
                    >
                      <div className="mr-2 flex-1 overflow-hidden">
                        <div
                          className="truncate text-sm leading-tight font-medium"
                          title={task.title}
                        >
                          {task.title}
                        </div>
                        <div className="mt-1 flex space-x-1.5 text-xs">
                          <span className="bg-oc-neutral/30 text-oc-text-gray rounded px-1.5 py-0.5">
                            {task.status}
                          </span>
                          {task.sprintId !== currentSprint.id && (
                            <span className="truncate rounded bg-blue-900/50 px-1.5 py-0.5 text-blue-300">
                              Desde: {getTaskSprintName(task)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleRemoveTask(task.id)}
                        className="ml-2 w-[70px] flex-shrink-0 bg-red-700 px-2 py-1 text-center text-xs leading-none hover:bg-red-600"
                      >
                        Quitar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="border-oc-outline-light/60 mt-4 flex justify-end gap-3 border-t pt-4">
          <Button
            onClick={handleClose}
            className="bg-oc-neutral text-oc-text-gray hover:bg-oc-neutral-light w-[100px]"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleMigrateTasks}
            disabled={
              selectedTasks.length === 0 || !targetSprintId || isSubmitting
            }
            className={`w-[160px] ${
              selectedTasks.length === 0 || !targetSprintId || isSubmitting
                ? "bg-oc-accent-primary/50 cursor-not-allowed opacity-50"
                : "bg-oc-accent-primary hover:bg-oc-accent-primary-dark"
            }`}
          >
            {isSubmitting ? (
              <>
                <i className="fa fa-spinner fa-spin mr-2"></i> Migrando...
              </>
            ) : (
              `Migrar ${selectedTasks.length} Tarea${selectedTasks.length !== 1 ? "s" : ""}`
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
