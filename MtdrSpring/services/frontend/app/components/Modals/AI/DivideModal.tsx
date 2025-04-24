import { useState, useEffect, useRef } from "react";
import type { Task } from "~/types";
import { Modal } from "~/components/Modal";
import { TaskCard } from "~/views/Tasks/TaskCard";
import { Button } from "../../Button";
import { TaskDetailModal } from "./TaskDetailModal";
import { EditableTaskModal } from "./EditableTaskModal";
import { getDividedTasks } from "~/services/aiService";
import useTaskStore from "~/store";

interface DivisionItem {
  original: Task;
  generated: Task[];
}

interface DivideModalProps {
  onClose: () => void;
  isVisible: boolean;
  initialTasks: Task[];
  startOnLoading?: boolean; // New prop to control starting state
}

export function DivideModal({
  onClose,
  isVisible,
  initialTasks = [],
  startOnLoading = false, // Default to false (normal behavior)
}: DivideModalProps) {
  const [step, setStep] = useState<
    "queue" | "loading" | "carousel" | "summary"
  >("queue");
  const [isInternalVisible, setIsInternalVisible] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [divisionData, setDivisionData] = useState<DivisionItem[]>([]);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [animationState, setAnimationState] = useState<
    "entering" | "visible" | "exiting"
  >("visible");
  const [visibleStep, setVisibleStep] = useState<typeof step>("queue");
  const [isInitialCarouselRender, setIsInitialCarouselRender] = useState(true);

  // Task detail states
  const [selectedTaskForDetail, setSelectedTaskForDetail] =
    useState<Task | null>(null);
  const [isOriginalTaskSelected, setIsOriginalTaskSelected] = useState(false);

  // Track if we've initialized loading
  const hasInitializedDivision = useRef(false);

  useEffect(() => {
    if (isVisible) {
      setTimeout(() => {
        setIsInternalVisible(true);

        if (initialTasks.length > 0) {
          setTasks(initialTasks);
        }

        // Check if we should skip to loading
        if (startOnLoading && initialTasks.length > 0) {
          setStep("loading");
          setVisibleStep("loading");
          hasInitializedDivision.current = false; // Reset flag to trigger division
        } else {
          setStep("queue");
          setVisibleStep("queue");
        }

        setDivisionData([]);
        setCurrentCarouselIndex(0);
        setAnimationState("visible");
        setIsInitialCarouselRender(true);
        setSelectedTaskForDetail(null);
      }, 0);
    } else {
      setIsInternalVisible(false);
      hasInitializedDivision.current = false;
    }
  }, [isVisible, initialTasks, startOnLoading]);

  // Separate effect to handle starting division after loading view is shown
  useEffect(() => {
    // Only run division if we're in loading step and haven't done it yet
    if (
      visibleStep === "loading" &&
      !hasInitializedDivision.current &&
      tasks.length > 0
    ) {
      console.log("Starting division process");
      hasInitializedDivision.current = true;
      startDivide();
    }
  }, [visibleStep, tasks]);

  const handleClose = (e?: React.MouseEvent) => {
    if (e && selectedTaskForDetail) {
      e.stopPropagation();
      return;
    }
    setIsInternalVisible(false);
    setTimeout(() => {
      onClose();
    }, 150);
  };

  const transitionToStep = (newStep: typeof step) => {
    setAnimationState("exiting");

    setTimeout(() => {
      setVisibleStep(newStep);
      setStep(newStep);
      setAnimationState("entering");

      setTimeout(() => {
        setAnimationState("visible");
      }, 50);
    }, 300);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (selectedTaskForDetail) {
        return;
      }

      if (event.key === "Escape") {
        handleClose();
      } else if (step === "carousel" && animationState === "visible") {
        if (
          event.key === "ArrowRight" &&
          currentCarouselIndex < divisionData.length - 1
        ) {
          setDirection("right");
          setAnimationState("exiting");

          setTimeout(() => {
            setCurrentCarouselIndex((prev) => prev + 1);
            setAnimationState("entering");

            setTimeout(() => {
              setAnimationState("visible");
            }, 50);
          }, 300);
        } else if (event.key === "ArrowLeft" && currentCarouselIndex > 0) {
          setDirection("left");
          setAnimationState("exiting");

          setTimeout(() => {
            setCurrentCarouselIndex((prev) => prev - 1);
            setAnimationState("entering");

            setTimeout(() => {
              setAnimationState("visible");
            }, 50);
          }, 300);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    step,
    handleClose,
    currentCarouselIndex,
    divisionData.length,
    animationState,
    selectedTaskForDetail,
  ]);

  const removeTask = (id: number) => {
    console.log("Removing task", id);
    const newTasks = tasks.filter((task) => task.id !== id);
    setTasks(newTasks);
    if (newTasks.length === 0) {
      handleClose();
    }
  };

  const startDivide = async () => {
    console.log("Starting division for tasks:", tasks);

    // No need to transition if we're already there
    if (visibleStep !== "loading") {
      transitionToStep("loading");
    }

    try {
      const generatedData = await Promise.all(
        tasks.map(async (task) => {
          // Use the numberOfSubtasks if specified on the task
          const subtaskCount = (task as any).numberOfSubtasks || 3;
          const additionalContext = (task as any).additionalContext || "";

          console.log(`Dividing task ${task.id} into ${subtaskCount} subtasks`);

          const generatedTasks = await getDividedTasks(
            task,
            subtaskCount,
            additionalContext,
          );

          return {
            original: task,
            generated: generatedTasks,
          };
        }),
      );

      console.log("Division complete, generated data:", generatedData);
      setDivisionData(generatedData);
      setCurrentCarouselIndex(0);
      setIsInitialCarouselRender(true);
      transitionToStep("carousel");
    } catch (error) {
      console.error("Error during division:", error);
      // Add error handling UI here
      handleClose();
    }
  };

  const handleRedivide = async () => {
    transitionToStep("loading");

    try {
      const currentItem = divisionData[currentCarouselIndex];

      // Use the numberOfSubtasks if specified on the task
      const subtaskCount = (currentItem.original as any).numberOfSubtasks || 3;
      const additionalContext =
        (currentItem.original as any).additionalContext || "";

      const generatedTasks = await getDividedTasks(
        currentItem.original,
        subtaskCount,
        additionalContext,
      );

      const updatedDivisionData = [...divisionData];
      updatedDivisionData[currentCarouselIndex] = {
        original: currentItem.original,
        generated: generatedTasks,
      };

      setDivisionData(updatedDivisionData);
      transitionToStep("carousel");
    } catch (error) {
      console.error("Error during redivision:", error);
      // Add error handling UI here
      handleClose();
    }
  };

  const handleNextItem = () => {
    if (currentCarouselIndex < divisionData.length - 1) {
      setDirection("right");
      setIsInitialCarouselRender(false);
      setAnimationState("exiting");

      setTimeout(() => {
        setCurrentCarouselIndex((prev) => prev + 1);
        setAnimationState("entering");

        setTimeout(() => {
          setAnimationState("visible");
        }, 50);
      }, 150);
    } else {
      transitionToStep("summary");
    }
  };

  const handlePrevItem = () => {
    if (currentCarouselIndex > 0) {
      setDirection("left");
      setIsInitialCarouselRender(false);
      setAnimationState("exiting");

      setTimeout(() => {
        setCurrentCarouselIndex((prev) => prev - 1);
        setAnimationState("entering");

        setTimeout(() => {
          setAnimationState("visible");
        }, 50);
      }, 150);
    }
  };

  const handleBackToCarousel = () => {
    setDirection("left");
    transitionToStep("carousel");
    setCurrentCarouselIndex(divisionData.length - 1);
  };

  // Integrate with store to delete originals and create generated tasks
  const deleteTasks = useTaskStore((state) => state.deleteTasks);
  const createTask = useTaskStore((state) => state.createTask);

  const handleAcceptChanges = () => {
    setAnimationState("exiting");
    console.log("Accepting changes:", divisionData);
    // Perform deletion of original and creation of generated tasks
    (async () => {
      const originalIds = divisionData.map((item) => item.original.id);
      // Iterate through divisionData to access original task properties
      try {
        await deleteTasks(originalIds);
        await Promise.all(
          divisionData.flatMap(
            (
              item, // Iterate through each original/generated pair
            ) =>
              item.generated.map(
                (
                  task, // Iterate through generated tasks for this original
                ) =>
                  createTask({
                    title: task.title,
                    description: task.description,
                    sprintId: item.original.sprintId, // Pass original sprintId
                    teamId: item.original.teamId, // Pass original teamId
                    estimatedHours: task.estimatedHours,
                    actualHours: task.actualHours,
                    assignees: task.assignees,
                    status: task.status,
                    tag: task.tag,
                    startDate: task.startDate,
                    // ... include other fields as needed
                  }),
              ),
          ),
        );
      } catch (error) {
        console.error("Error applying divided tasks:", error);
      } finally {
        setTimeout(() => {
          handleClose();
        }, 300);
      }
    })();
  };

  const handleTaskClick = (task: Task, isOriginal: boolean = false) => {
    setSelectedTaskForDetail(task);
    setIsOriginalTaskSelected(isOriginal);
  };

  const handleTaskDetailClose = () => {
    setSelectedTaskForDetail(null);
  };

  // Update a generated task
  const handleUpdateGeneratedTask = (updatedTask: Task) => {
    const currentItem = divisionData[currentCarouselIndex];
    const updatedGenerated = currentItem.generated.map((task) =>
      task.id === updatedTask.id ? updatedTask : task,
    );

    const updatedDivisionData = [...divisionData];
    updatedDivisionData[currentCarouselIndex] = {
      original: currentItem.original,
      generated: updatedGenerated,
    };

    setDivisionData(updatedDivisionData);
    setSelectedTaskForDetail(null);
  };

  // Remove a generated task
  const handleRemoveGeneratedTask = () => {
    if (!selectedTaskForDetail) return;

    const currentItem = divisionData[currentCarouselIndex];
    const updatedGenerated = currentItem.generated.filter(
      (task) => task.id !== selectedTaskForDetail.id,
    );

    const updatedDivisionData = [...divisionData];
    updatedDivisionData[currentCarouselIndex] = {
      original: currentItem.original,
      generated: updatedGenerated,
    };

    setDivisionData(updatedDivisionData);
    setSelectedTaskForDetail(null);
  };

  const renderStepContent = () => {
    switch (visibleStep) {
      case "queue":
        return (
          <QueueView
            tasks={tasks}
            removeTask={removeTask}
            startDivide={startDivide}
            animationState={animationState}
            onTaskClick={(task) => handleTaskClick(task, false)}
          />
        );
      case "loading":
        return <LoadingView animationState={animationState} />;
      case "carousel":
        return divisionData.length > 0 ? (
          <div className="flex h-full flex-col">
            <TaskDivisionGroup
              key={currentCarouselIndex}
              item={divisionData[currentCarouselIndex]}
              onRedivide={handleRedivide}
              onAccept={handleNextItem}
              animationState={animationState}
              direction={direction}
              isInitialRender={isInitialCarouselRender}
              onOriginalTaskClick={(task) => handleTaskClick(task, true)}
              onGeneratedTaskClick={(task) => handleTaskClick(task, false)}
            />
            <div className="border-oc-outline-light flex items-center justify-center border-t p-4">
              <div className="flex items-center">
                <Button
                  onClick={handlePrevItem}
                  disabled={
                    currentCarouselIndex === 0 || animationState !== "visible"
                  }
                  className="bg-oc-neutral text-oc-text-gray hover:bg-oc-neutral-light mr-2 flex h-8 w-8 items-center justify-center rounded disabled:opacity-50"
                >
                  <i className="fa fa-chevron-left"></i>
                </Button>
                <span className="text-oc-text-gray mx-2 w-[200px] text-center">
                  <span className="animate-fadeIn">
                    {currentCarouselIndex + 1} / {divisionData.length}
                  </span>
                </span>
                <Button
                  onClick={handleNextItem}
                  disabled={animationState !== "visible"}
                  className="bg-oc-neutral text-oc-text-gray hover:bg-oc-neutral-light ml-2 flex h-8 w-8 items-center justify-center rounded"
                >
                  <i className="fa fa-chevron-right"></i>
                </Button>
              </div>
            </div>
          </div>
        ) : null;
      case "summary":
        return (
          <SummaryView
            divisionData={divisionData}
            onAccept={handleAcceptChanges}
            onCancel={handleClose}
            onBack={handleBackToCarousel}
            animationState={animationState}
            onOriginalTaskClick={(task) => handleTaskClick(task, true)}
            onGeneratedTaskClick={(task) => handleTaskClick(task, false)}
          />
        );
      default:
        return null;
    }
  };

  const getModalTitle = () => {
    switch (step) {
      case "queue":
        return "Seleccionar Tareas para Dividir";
      case "loading":
        return "Dividiendo Tareas";
      case "carousel":
        return "Revisar Subtareas Generadas";
      case "summary":
        return "Resumen de División de Tareas";
      default:
        return "Dividir Tareas";
    }
  };

  return (
    <Modal
      className="bg-oc-dark-gray-accent h-[820px] max-h-[820px] w-[900px] transition-discrete"
      isVisible={isInternalVisible}
      onClose={handleClose}
      handleClose={handleClose}
      isOverlayInteractive={!selectedTaskForDetail}
    >
      <div className="flex h-full w-full flex-col overflow-hidden">
        <div className="border-oc-outline-light/60 bg-oc-dark-gray-accent sticky top-0 border-b p-4">
          <h2 className="text-xl font-semibold text-white transition-all duration-300">
            {getModalTitle()}
          </h2>
        </div>

        <div className="flex-1 overflow-hidden">{renderStepContent()}</div>
      </div>

      {/* Use TaskDetailModal for original tasks */}
      {selectedTaskForDetail && isOriginalTaskSelected && (
        <TaskDetailModal
          task={selectedTaskForDetail}
          onClose={handleTaskDetailClose}
        />
      )}

      {/* Use EditableTaskModal for generated tasks */}
      {selectedTaskForDetail && !isOriginalTaskSelected && (
        <EditableTaskModal
          task={selectedTaskForDetail}
          onClose={handleTaskDetailClose}
          onUpdate={handleUpdateGeneratedTask}
          onRemove={handleRemoveGeneratedTask}
          isEditable={true}
        />
      )}
    </Modal>
  );
}

// Original LoadingView component
function LoadingView({
  animationState,
}: {
  animationState: "entering" | "visible" | "exiting";
}) {
  return (
    <div
      className={`flex h-full flex-col items-center justify-center p-8 transition-all duration-300 ${
        animationState === "entering"
          ? "scale-95 opacity-0"
          : animationState === "exiting"
            ? "scale-105 opacity-0"
            : "scale-100 opacity-100"
      }`}
    >
      <div className="mb-4 animate-spin">
        <svg
          className="text-oc-accent-primary h-16 w-16"
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
      <h3 className="mb-2 text-xl font-medium text-white">Dividiendo Tareas</h3>
    </div>
  );
}

// Queue view updated to handle original tasks
function QueueView({
  tasks,
  removeTask,
  startDivide,
  animationState,
  onTaskClick,
}: {
  tasks: Task[];
  removeTask: (id: number) => void;
  startDivide: () => void;
  animationState: "entering" | "visible" | "exiting";
  onTaskClick: (task: Task) => void;
}) {
  return (
    <div
      className={`flex h-full flex-col transition-all duration-300 ${
        animationState === "entering"
          ? "translate-x-10 opacity-0"
          : animationState === "exiting"
            ? "-translate-x-10 opacity-0"
            : "translate-x-0 opacity-100"
      }`}
    >
      <div className="border-oc-outline-light border-b p-4">
        <p className="text-oc-text-gray text-center text-sm">
          Estas tareas se dividirán en tareas más pequeñas y manejables.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {tasks.length === 0 ? (
          <div className="text-oc-text-gray flex h-full items-center justify-center">
            {/* No se han seleccionado tareas para dividir */}
          </div>
        ) : (
          <div className="mx-auto max-w-lg space-y-4">
            {tasks.map((task, index) => (
              <div
                key={task.id}
                className="group animate-fadeIn relative"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <TaskCard
                  task={task}
                  onClick={() => onTaskClick(task)}
                  onSelect={() => {}}
                  isSelected={false}
                  showAssignees={true}
                  sprints={[]}
                  hideSelect={true}
                />
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTask(task.id);
                  }}
                  className="absolute top-2 right-2 flex h-6 max-w-6 cursor-pointer items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-lg transition-all group-hover:opacity-100 hover:bg-red-600"
                >
                  <i className="fa fa-times text-xs"></i>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-oc-outline-light flex justify-center border-t p-4">
        <Button
          onClick={startDivide}
          disabled={tasks.length === 0}
          className="bg-oc-accent-primary hover:bg-oc-accent-primary-dark rounded px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
        >
          Iniciar División
        </Button>
      </div>
    </div>
  );
}

// Updated TaskDivisionGroup component to distinguish between original and generated task clicks
function TaskDivisionGroup({
  item,
  onRedivide,
  onAccept,
  animationState,
  direction,
  isInitialRender,
  onOriginalTaskClick,
  onGeneratedTaskClick,
}: {
  item: DivisionItem;
  onRedivide: () => void;
  onAccept: () => void;
  animationState: "entering" | "visible" | "exiting";
  direction: "left" | "right";
  isInitialRender: boolean;
  onOriginalTaskClick: (task: Task) => void;
  onGeneratedTaskClick: (task: Task) => void;
}) {
  const originalTaskRef = useRef<HTMLDivElement>(null);
  const generatedTaskRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [arrowPaths, setArrowPaths] = useState<string[]>([]);

  // Calculate and update arrow paths after component renders and when tasks change
  useEffect(() => {
    if (originalTaskRef.current && generatedTaskRefs.current.length > 0) {
      const updateArrows = () => {
        const originalRect = originalTaskRef.current?.getBoundingClientRect();
        const containerRect =
          originalTaskRef.current?.parentElement?.parentElement?.getBoundingClientRect() || {
            left: 0,
            top: 0,
          };

        if (!originalRect) return;

        const newPaths = generatedTaskRefs.current.map((ref) => {
          if (!ref) return "";

          const targetRect = ref.getBoundingClientRect();

          // Calculate relative positions
          // For desktop view with horizontal layout
          if (window.innerWidth >= 768) {
            // Start from right edge of original task
            const startX = originalRect.right - containerRect.left;
            const startY =
              originalRect.top + originalRect.height / 2 - containerRect.top;

            // End at left edge of generated task
            const endX = targetRect.left - containerRect.left;
            const endY =
              targetRect.top + targetRect.height / 2 - containerRect.top;

            // Create a curved path
            return `M${startX},${startY} C${startX + 40},${startY} ${endX - 40},${endY} ${endX},${endY}`;
          }
          // For mobile view with vertical layout
          else {
            // Start from bottom center of original task
            const startX =
              originalRect.left + originalRect.width / 2 - containerRect.left;
            const startY = originalRect.bottom - containerRect.top;

            // End at top center of generated task
            const endX =
              targetRect.left + targetRect.width / 2 - containerRect.left;
            const endY = targetRect.top - containerRect.top;

            return `M${startX},${startY} C${startX},${startY + 20} ${endX},${endY - 20} ${endX},${endY}`;
          }
        });

        setArrowPaths(newPaths);
      };

      // Initial update
      updateArrows();

      // Update on resize
      window.addEventListener("resize", updateArrows);

      return () => {
        window.removeEventListener("resize", updateArrows);
      };
    }
  }, [item.generated.length]);

  // Reset refs when tasks change
  useEffect(() => {
    generatedTaskRefs.current = generatedTaskRefs.current.slice(
      0,
      item.generated.length,
    );
  }, [item.generated]);

  // Fix the animation direction logic
  const getTranslateClass = () => {
    if (animationState === "visible") {
      return "translate-x-0 opacity-100";
    }

    // When entering:
    if (animationState === "entering") {
      // If it's the initial render, just fade in without translation
      if (isInitialRender) {
        return "opacity-0";
      }

      // If direction is right, enter from right
      // If direction is left, enter from left
      return direction === "right"
        ? "translate-x-full opacity-0"
        : "-translate-x-full opacity-0";
    }

    // When exiting:
    // If direction is right, exit to left
    // If direction is left, exit to right
    return direction === "right"
      ? "-translate-x-full opacity-0"
      : "translate-x-full opacity-0";
  };

  return (
    <div
      className={`flex h-full flex-col transition-all duration-250 ${getTranslateClass()}`}
    >
      <div className="border-oc-outline-light/60 border-b p-4">
        <h3 className="text-lg font-medium text-white">Desglose de Tareas</h3>
        <p className="text-oc-text-gray text-sm">
          La tarea original se ha dividido en subtareas más pequeñas. Puedes
          editar o eliminar las subtareas generadas.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="relative mx-auto flex h-full max-w-4xl flex-col items-center md:flex-row md:items-start md:justify-center md:gap-10">
          {/* SVG for arrows */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            style={{ zIndex: 1 }}
          >
            {arrowPaths.map((path, index) => (
              <path
                key={index}
                d={path}
                fill="none"
                stroke="white"
                strokeWidth="1.5"
                strokeDasharray="5,5"
                markerEnd="url(#arrowhead)"
                className="animate-dash"
              />
            ))}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9.5"
                refY="3.5"
                orient="auto"
              >
                <polygon points="5 1, 9 3.5, 5 6" fill="white" />
              </marker>
            </defs>
          </svg>

          <div className="mb-16 flex h-full w-full flex-col items-center justify-center md:mb-0">
            <h3 className="text-oc-text-gray-dark mb-4 text-center text-sm font-medium">
              Tarea Original
            </h3>
            <div className="animate-fadeIn w-[350px]" ref={originalTaskRef}>
              <TaskCard
                task={item.original}
                onClick={() => onOriginalTaskClick(item.original)}
                onSelect={() => {}}
                isSelected={false}
                showAssignees={true}
                sprints={[]}
                hideSelect={true}
              />
            </div>
          </div>

          <div className="flex h-full w-full flex-col items-center justify-center">
            <h3 className="text-oc-text-gray-dark mb-4 text-center text-sm font-medium">
              Sub-Tareas Generadas
            </h3>
            <div className="flex flex-col gap-6">
              {item.generated.map((genTask, index) => (
                <div
                  key={genTask.id}
                  className="animate-slideInRight group relative"
                  style={{ animationDelay: `${200 + index * 150}ms` }}
                >
                  <div
                    className="w-[450px]"
                    ref={(el) => {
                      generatedTaskRefs.current[index] = el;
                    }}
                  >
                    <TaskCard
                      task={genTask}
                      onClick={() => onGeneratedTaskClick(genTask)}
                      onSelect={() => {}}
                      isSelected={false}
                      showAssignees={true}
                      sprints={[]}
                      hideSelect={true}
                    />
                  </div>

                  {/* Edit indicator */}
                  <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="rounded-md bg-stone-800/80 px-2 py-1 text-xs text-blue-300">
                      <i className="fa fa-edit mr-1"></i>
                      Editable
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-oc-outline-light flex justify-center space-x-4 border-t p-4">
        <Button
          onClick={onRedivide}
          className="bg-oc-neutral text-oc-text-gray hover:bg-oc-neutral-light rounded px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors"
        >
          Re-Dividir
        </Button>
        <Button
          onClick={onAccept}
          className="bg-oc-accent-primary hover:bg-oc-accent-primary-dark rounded px-4 py-2 text-sm font-medium whitespace-nowrap text-white transition-colors"
        >
          Aceptar
        </Button>
      </div>
    </div>
  );
}

// Updated SummaryView component to distinguish between original and generated task clicks
function SummaryView({
  divisionData,
  onAccept,
  onCancel,
  onBack,
  animationState,
  onOriginalTaskClick,
  onGeneratedTaskClick,
}: {
  divisionData: DivisionItem[];
  onAccept: () => void;
  onCancel: () => void;
  onBack: () => void;
  animationState: "entering" | "visible" | "exiting";
  onOriginalTaskClick: (task: Task) => void;
  onGeneratedTaskClick: (task: Task) => void;
}) {
  const totalOriginalTasks = divisionData.length;
  const totalGeneratedTasks = divisionData.reduce(
    (acc, item) => acc + item.generated.length,
    0,
  );

  return (
    <div
      className={`flex h-full flex-col transition-all duration-300 ${
        animationState === "entering"
          ? "translate-y-20 opacity-0"
          : animationState === "exiting"
            ? "-translate-y-20 opacity-0"
            : "translate-y-0 opacity-100"
      }`}
    >
      <div className="border-oc-outline-light border-b p-4">
        <h3 className="text-lg font-medium text-white">Resumen</h3>
        <p className="text-oc-text-gray text-sm">
          {totalOriginalTasks} tarea{totalOriginalTasks !== 1 ? "s" : ""}{" "}
          original
          {totalOriginalTasks !== 1 ? "es" : " será"} reemplazada
          {totalOriginalTasks !== 1 ? "s" : ""} con {totalGeneratedTasks}{" "}
          subtarea
          {totalGeneratedTasks !== 1 ? "s" : ""}.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto flex max-w-5xl flex-col justify-center gap-8 md:flex-row">
          <div className="w-[350px]">
            <h3 className="text-oc-text-gray-dark mb-4 text-center text-sm font-medium">
              Tareas Originales ({totalOriginalTasks})
            </h3>
            <div className="space-y-4">
              {divisionData.map((item, index) => (
                <div
                  key={item.original.id}
                  className="animate-fadeIn"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <TaskCard
                    task={item.original}
                    onClick={() => onOriginalTaskClick(item.original)}
                    onSelect={() => {}}
                    isSelected={false}
                    showAssignees={true}
                    sprints={[]}
                    hideSelect={true}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="w-[350px]">
            <h3 className="text-oc-text-gray-dark mb-4 text-center text-sm font-medium">
              Tareas Generadas ({totalGeneratedTasks})
            </h3>
            <div className="space-y-4">
              {divisionData.flatMap((item, itemIndex) =>
                item.generated.map((genTask, taskIndex) => (
                  <div
                    key={genTask.id}
                    className="animate-fadeIn"
                    style={{
                      animationDelay: `${200 + (itemIndex * 3 + taskIndex) * 50}ms`,
                    }}
                  >
                    <TaskCard
                      task={genTask}
                      onClick={() => onGeneratedTaskClick(genTask)}
                      onSelect={() => {}}
                      isSelected={false}
                      showAssignees={true}
                      sprints={[]}
                      hideSelect={true}
                    />
                  </div>
                )),
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-oc-outline-light flex justify-center border-t p-4">
        <div className="flex w-full gap-4 px-10">
          <Button
            onClick={onBack}
            className="bg-oc-neutral text-oc-text-gray hover:bg-oc-neutral-light w-full rounded px-4 py-2 text-sm font-medium transition-colors"
          >
            <i className="fa fa-arrow-left mr-2"></i>
            Atrás
          </Button>

          <Button
            onClick={onAccept}
            className="bg-oc-accent-primary hover:bg-oc-accent-primary-dark w-full animate-pulse rounded px-4 py-2 text-sm font-medium whitespace-nowrap text-white transition-colors"
          >
            Confirmar Cambios
          </Button>
        </div>
      </div>
    </div>
  );
}
