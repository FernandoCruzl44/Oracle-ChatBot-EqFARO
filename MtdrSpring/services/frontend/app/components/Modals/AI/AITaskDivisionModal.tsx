import { useState, useEffect } from "react";
import type { Task } from "~/types";
import { Modal } from "~/components/Modal";
import { Button } from "~/components/Button";
import { TaskDetailModal } from "./TaskDetailModal";
import { SelectionTaskCard } from "./SelectionTaskCard";
import { DivideModal } from "./DivideModal";
import { getDividedTasks, analyzeTasksForDivision } from "~/services/aiService";

interface AITaskDivisionModalProps {
  onClose: () => void;
  isVisible: boolean;
  tasks: Task[];
}

export function AITaskDivisionModal({
  onClose,
  isVisible,
  tasks,
}: AITaskDivisionModalProps) {
  // Visibility states
  const [isInternalVisible, setIsInternalVisible] = useState(false);

  // Analysis states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendedTasks, setRecommendedTasks] = useState<Task[]>([]);
  const [recommendations, setRecommendations] = useState<
    Record<number, string>
  >({});
  const [error, setError] = useState<string | null>(null);

  // Task selection and parameters
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(
    new Set(),
  );
  const [subtaskCounts, setSubtaskCounts] = useState<Map<number, number>>(
    new Map(),
  );

  // Modal states
  const [taskDetailId, setTaskDetailId] = useState<number | null>(null);
  const [showDivideModal, setShowDivideModal] = useState(false);

  // Reset everything when visibility changes
  useEffect(() => {
    if (isVisible) {
      setIsInternalVisible(true);
      resetState();
      // Start analysis immediately
      handleAnalyze();
    } else {
      setIsInternalVisible(false);
    }
  }, [isVisible]);

  // Reset all state values to defaults
  const resetState = () => {
    setIsAnalyzing(false);
    setRecommendedTasks([]);
    setRecommendations({});
    setError(null);
    setSelectedTaskIds(new Set());
    setSubtaskCounts(new Map());
    setTaskDetailId(null);
    setShowDivideModal(false);
  };

  // Handle modal close
  const handleClose = () => {
    setIsInternalVisible(false);
    setTimeout(onClose, 200);
  };

  // Run task analysis
  const handleAnalyze = async () => {
    try {
      setIsAnalyzing(true);
      setError(null);

      // Filter tasks that can be divided
      const backlogTasks = tasks.filter(
        (task) => task.status === "Backlog" || task.status === "To Do",
      );

      if (backlogTasks.length === 0) {
        throw new Error("No hay tareas en el backlog para analizar.");
      }

      // Get AI recommendations
      const analysisResult = await analyzeTasksForDivision(backlogTasks, 3, "");

      // Map recommendations by task ID
      const recommendationsMap: Record<number, string> = {};
      analysisResult.recommendations.forEach((rec) => {
        recommendationsMap[rec.taskId] = rec.reason;
      });

      // Get the recommended task objects
      const recommendedTasksList = backlogTasks.filter((task) =>
        analysisResult.recommendations.some((rec) => rec.taskId === task.id),
      );

      // Update state with results
      setRecommendedTasks(recommendedTasksList);
      setRecommendations(recommendationsMap);

      // Select all tasks by default and set default subtask counts
      const newSelectedIds = new Set<number>();
      const newSubtaskCounts = new Map<number, number>();

      recommendedTasksList.forEach((task) => {
        newSelectedIds.add(task.id);
        newSubtaskCounts.set(task.id, 3);
      });

      setSelectedTaskIds(newSelectedIds);
      setSubtaskCounts(newSubtaskCounts);
    } catch (error) {
      console.error("Error analyzing tasks:", error);
      setError(
        error instanceof Error ? error.message : "Error al analizar las tareas",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Toggle task selection
  const handleToggleSelect = (taskId: number) => {
    setSelectedTaskIds((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(taskId)) {
        newSelection.delete(taskId);
      } else {
        newSelection.add(taskId);
      }
      return newSelection;
    });
  };

  // Update subtask count for a task
  const handleSubtaskCountChange = (taskId: number, count: number) => {
    setSubtaskCounts((prev) => {
      const newCounts = new Map(prev);
      newCounts.set(taskId, count);
      return newCounts;
    });
  };

  // Show task details
  const handleShowTaskDetail = (taskId: number) => {
    setTaskDetailId(taskId);
  };

  // Close task detail modal
  const handleCloseTaskDetail = () => {
    setTaskDetailId(null);
  };

  // Start the division process
  const handleStartDivide = () => {
    if (selectedTaskIds.size === 0) {
      setError("Selecciona al menos una tarea para dividir.");
      return;
    }

    // Get the selected tasks with their params
    const tasksToProcess = getSelectedTasksWithParams();

    // Show divide modal directly on the loading/dividing step
    setShowDivideModal(true);
  };

  // Close the divide modal
  const handleCloseDivideModal = () => {
    setShowDivideModal(false);
    handleClose();
  };

  // Get the selected tasks with their parameters
  const getSelectedTasksWithParams = () => {
    return recommendedTasks
      .filter((task) => selectedTaskIds.has(task.id))
      .map((task) => ({
        ...task,
        numberOfSubtasks: subtaskCounts.get(task.id) || 3,
        additionalContext: "", // Default empty for now
      }));
  };

  // Find a task by ID
  const getTaskById = (id: number | null): Task | undefined => {
    if (id === null) return undefined;
    return recommendedTasks.find((task) => task.id === id);
  };

  return (
    <>
      <Modal
        className="bg-oc-dark-gray-accent h-[700px] w-[900px]"
        isVisible={isInternalVisible}
        onClose={handleClose}
        handleClose={handleClose}
        isOverlayInteractive={taskDetailId === null}
      >
        <div className="flex h-full w-full flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-oc-dark-gray-accent sticky top-0 border-b border-gray-700/60 p-4">
            <h2 className="text-xl font-semibold text-white">
              Seleccionar Tareas para Dividir
            </h2>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-hidden">
            {isAnalyzing ? (
              <div className="flex h-full flex-col items-center justify-center p-8">
                <div className="mb-4 animate-spin">
                  <svg
                    className="h-16 w-16 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-medium text-white">
                  Analizando Tareas
                </h3>
                <p className="max-w-md text-center text-gray-400">
                  Estamos identificando tareas que se pueden dividir en
                  subtareas más pequeñas...
                </p>
              </div>
            ) : error ? (
              <div className="flex h-full flex-col items-center justify-center p-8 text-red-400">
                <i className="fa fa-exclamation-circle mb-4 text-4xl"></i>
                <p className="text-center">{error}</p>
              </div>
            ) : (
              <div className="flex h-full flex-col opacity-100 transition-all duration-200">
                <div className="border-b border-gray-700 p-4">
                  <p className="text-center text-sm text-gray-400">
                    Estas tareas se dividirán en tareas más pequeñas y
                    manejables. Selecciona las que deseas procesar.
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {recommendedTasks.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-gray-400">
                      No se encontraron tareas candidatas para dividir.
                    </div>
                  ) : (
                    <div className="mx-auto max-w-3xl space-y-4">
                      {recommendedTasks.map((task, index) => (
                        <div
                          key={task.id}
                          className="animate-fadeIn"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <SelectionTaskCard
                            task={task}
                            onClick={() => handleShowTaskDetail(task.id)}
                            selected={selectedTaskIds.has(task.id)}
                            onToggleSelect={() => handleToggleSelect(task.id)}
                            subtaskCount={subtaskCounts.get(task.id) || 3}
                            onSubtaskCountChange={(count) =>
                              handleSubtaskCountChange(task.id, count)
                            }
                            recommendation={recommendations[task.id]}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-between border-t border-gray-700 p-4">
                  <div className="text-sm text-gray-400">
                    {selectedTaskIds.size} tarea
                    {selectedTaskIds.size !== 1 ? "s" : ""} seleccionada
                    {selectedTaskIds.size !== 1 ? "s" : ""}
                  </div>
                  <Button
                    onClick={handleStartDivide}
                    disabled={selectedTaskIds.size === 0}
                    className="rounded px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
                  >
                    Iniciar División
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Task Detail Modal */}
      {taskDetailId !== null && (
        <TaskDetailModal
          task={getTaskById(taskDetailId)!}
          onClose={handleCloseTaskDetail}
        />
      )}

      {/* Use the fixed DivideModal */}
      {showDivideModal && (
        <DivideModal
          onClose={handleCloseDivideModal}
          isVisible={showDivideModal}
          initialTasks={getSelectedTasksWithParams()}
          startOnLoading={true} // Skip to loading step only, not the division process
        />
      )}
    </>
  );
}
