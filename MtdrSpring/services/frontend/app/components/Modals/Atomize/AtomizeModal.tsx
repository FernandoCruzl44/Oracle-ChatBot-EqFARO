import { useState, useEffect, useRef } from "react";
import type { Task } from "~/types";
import { Modal } from "~/components/Modal";
import { TaskCard } from "~/views/Tasks/TaskCard";
import { Button } from "../../Button";

// Add import for the new TaskDetailModal
import { TaskDetailModal } from "./TaskDetailModal";

interface AtomizationItem {
  original: Task;
  generated: Task[];
}

interface AtomizeModalProps {
  onClose: () => void;
  isVisible: boolean;
  initialTasks: Task[];
}

const SAMPLE_GENERATED_TASKS: { original: Task; generated: Task[] }[] = [
  {
    original: {
      id: 1,
      title: "Implementar sistema de autenticación de usuarios",
      tag: "Feature",
      status: "En Progreso",
      startDate: "2025-04-11",
      endDate: "2025-04-20",
      creatorName: "John Doe",
      assignees: [{ id: 1, name: "John Doe" }],
    },
    generated: [
      {
        id: 11,
        title: "Configurar endpoints de registro de usuarios",
        tag: "Feature",
        status: "To Do",
        startDate: "2025-04-11",
        endDate: "2025-04-15",
        creatorName: "John Doe",
        assignees: [{ id: 1, name: "John Doe" }],
      },
      {
        id: 12,
        title: "Implementar funcionalidad de inicio de sesión",
        tag: "Feature",
        status: "To Do",
        startDate: "2025-04-16",
        endDate: "2025-04-18",
        creatorName: "John Doe",
        assignees: [{ id: 1, name: "John Doe" }],
      },
      {
        id: 13,
        title: "Añadir flujo de restablecimiento de contraseña",
        tag: "Feature",
        status: "To Do",
        startDate: "2025-04-18",
        endDate: "2025-04-20",
        creatorName: "John Doe",
        assignees: [{ id: 1, name: "John Doe" }],
      },
    ],
  },
  {
    original: {
      id: 2,
      title: "Diseñar e implementar esquema de base de datos",
      tag: "Feature",
      status: "To Do",
      startDate: "2025-04-15",
      endDate: "2025-04-25",
      creatorName: "Jane Smith",
      assignees: [{ id: 2, name: "Jane Smith" }],
    },
    generated: [
      {
        id: 21,
        title: "Diseñar diagrama de relación de entidades",
        tag: "Feature",
        status: "To Do",
        startDate: "2025-04-15",
        endDate: "2025-04-18",
        creatorName: "Jane Smith",
        assignees: [{ id: 2, name: "Jane Smith" }],
      },
      {
        id: 22,
        title: "Crear scripts de migración SQL",
        tag: "Feature",
        status: "To Do",
        startDate: "2025-04-18",
        endDate: "2025-04-21",
        creatorName: "Jane Smith",
        assignees: [{ id: 2, name: "Jane Smith" }],
      },
      {
        id: 23,
        title: "Implementar modelos ORM",
        tag: "Feature",
        status: "To Do",
        startDate: "2025-04-21",
        endDate: "2025-04-25",
        creatorName: "Jane Smith",
        assignees: [{ id: 2, name: "Jane Smith" }],
      },
    ],
  },
];

function QueueView({
  tasks,
  removeTask,
  startAtomize,
  animationState,
  onTaskClick,
}: {
  tasks: Task[];
  removeTask: (id: number) => void;
  startAtomize: () => void;
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
      {/* <div className="border-oc-outline-light border-b p-4">
        <h3 className="text-lg font-medium text-white">Cola de Tareas</h3>
        <p className="text-oc-text-gray text-sm">
          Estas tareas se dividirán en tareas más pequeñas y manejables.
        </p>
      </div> */}

      <div className="border-oc-outline-light border-b p-4">
        <p className="text-oc-text-gray text-center text-sm">
          Estas tareas se dividirán en tareas más pequeñas y manejables.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {tasks.length === 0 ? (
          <div className="text-oc-text-gray flex h-full items-center justify-center">
            {/* No se han seleccionado tareas para atomizar */}
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
          onClick={startAtomize}
          disabled={tasks.length === 0}
          className="bg-oc-accent-primary hover:bg-oc-accent-primary-dark rounded px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
        >
          Iniciar Atomización
        </Button>
      </div>
    </div>
  );
}

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
      <h3 className="mb-2 text-xl font-medium text-white">Atomizando Tareas</h3>
      {/* <p className="text-oc-text-gray max-w-md text-center">
        Nuestra IA está analizando tus tareas y dividiéndolas en subtareas más
        pequeñas y manejables. Esto puede tomar unos momentos...
      </p> */}
    </div>
  );
}

function TaskAtomizationGroup({
  item,
  onReatomize,
  onAccept,
  animationState,
  direction,
  isInitialRender,
  onTaskClick,
}: {
  item: AtomizationItem;
  onReatomize: () => void;
  onAccept: () => void;
  animationState: "entering" | "visible" | "exiting";
  direction: "left" | "right";
  isInitialRender: boolean;
  onTaskClick: (task: Task) => void;
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
      {/* <div className="border-oc-outline-light border-b p-4">
        <h3 className="text-lg font-medium text-white">Desglose de Tareas</h3>
        <p className="text-oc-text-gray text-sm">
          La tarea original se ha dividido en subtareas más pequeñas.
        </p>
      </div> */}

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
                onClick={() => onTaskClick(item.original)}
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
                  className="animate-slideInRight"
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
                      onClick={() => onTaskClick(genTask)}
                      onSelect={() => {}}
                      isSelected={false}
                      showAssignees={true}
                      sprints={[]}
                      hideSelect={true}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-oc-outline-light flex justify-center space-x-4 border-t p-4">
        <Button
          onClick={onReatomize}
          className="bg-oc-neutral text-oc-text-gray hover:bg-oc-neutral-light rounded px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors"
        >
          Re-Atomizar
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

function SummaryView({
  atomizationData,
  onAccept,
  onCancel,
  onBack,
  animationState,
  onTaskClick,
}: {
  atomizationData: AtomizationItem[];
  onAccept: () => void;
  onCancel: () => void;
  onBack: () => void;
  animationState: "entering" | "visible" | "exiting";
  onTaskClick: (task: Task) => void;
}) {
  const totalOriginalTasks = atomizationData.length;
  const totalGeneratedTasks = atomizationData.reduce(
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
              {atomizationData.map((item, index) => (
                <div
                  key={item.original.id}
                  className="animate-fadeIn"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <TaskCard
                    task={item.original}
                    onClick={() => onTaskClick(item.original)}
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
              {atomizationData.flatMap((item, itemIndex) =>
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
                      onClick={() => onTaskClick(genTask)}
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

export function AtomizeModal({
  onClose,
  isVisible,
  initialTasks = [],
}: AtomizeModalProps) {
  const [step, setStep] = useState<
    "queue" | "loading" | "carousel" | "summary"
  >("queue");
  const [isInternalVisible, setIsInternalVisible] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [atomizationData, setAtomizationData] = useState<AtomizationItem[]>([]);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [animationState, setAnimationState] = useState<
    "entering" | "visible" | "exiting"
  >("visible");
  const [visibleStep, setVisibleStep] = useState<typeof step>("queue");
  const [isInitialCarouselRender, setIsInitialCarouselRender] = useState(true);

  // Add state for the selected task to view details
  const [selectedTaskForDetail, setSelectedTaskForDetail] =
    useState<Task | null>(null);

  useEffect(() => {
    if (isVisible) {
      setTimeout(() => {
        setIsInternalVisible(true);
        if (initialTasks.length > 0) {
          setTasks(initialTasks);
        }
        setStep("queue");
        setVisibleStep("queue");
        setAtomizationData([]);
        setCurrentCarouselIndex(0);
        setAnimationState("visible");
        setIsInitialCarouselRender(true);
        setSelectedTaskForDetail(null);
      }, 0);
    } else {
      setIsInternalVisible(false);
    }
  }, [isVisible, initialTasks]);

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
          currentCarouselIndex < atomizationData.length - 1
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
    atomizationData.length,
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

  const startAtomize = () => {
    transitionToStep("loading");

    setTimeout(() => {
      const generatedData = tasks.map((task) => {
        const sampleMatch = SAMPLE_GENERATED_TASKS.find(
          (sample) =>
            sample.original.title
              .toLowerCase()
              .includes(task.title.toLowerCase()) ||
            task.title
              .toLowerCase()
              .includes(sample.original.title.toLowerCase()),
        );

        if (sampleMatch) {
          return {
            original: task,
            generated: sampleMatch.generated.map((g) => ({
              ...g,
              assignees: task.assignees,
            })),
          };
        }

        return {
          original: task,
          generated: [
            {
              id: task.id * 100 + 1,
              title: `${task.title} - Fase de planificación`,
              tag: task.tag,
              status: "Por Hacer",
              startDate: task.startDate,
              endDate: task.endDate,
              creatorName: task.creatorName,
              assignees: task.assignees,
            },
            {
              id: task.id * 100 + 2,
              title: `${task.title} - Fase de implementación`,
              tag: task.tag,
              status: "Por Hacer",
              startDate: task.startDate,
              endDate: task.endDate,
              creatorName: task.creatorName,
              assignees: task.assignees,
            },
            {
              id: task.id * 100 + 3,
              title: `${task.title} - Fase de pruebas`,
              tag: task.tag,
              status: "Por Hacer",
              startDate: task.startDate,
              endDate: task.endDate,
              creatorName: task.creatorName,
              assignees: task.assignees,
            },
          ],
        };
      });

      setAtomizationData(generatedData);
      setCurrentCarouselIndex(0);
      setIsInitialCarouselRender(true);
      transitionToStep("carousel");
    }, 1500);
  };

  const handleReatomize = () => {
    transitionToStep("loading");

    setTimeout(() => {
      transitionToStep("carousel");
    }, 1500);
  };

  const handleNextItem = () => {
    if (currentCarouselIndex < atomizationData.length - 1) {
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
    setCurrentCarouselIndex(atomizationData.length - 1);
  };

  const handleAcceptChanges = () => {
    setAnimationState("exiting");
    console.log("Accepting changes:", atomizationData);
    setTimeout(() => {
      handleClose();
    }, 300);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTaskForDetail(task);
  };

  const handleTaskDetailClose = () => {
    setSelectedTaskForDetail(null);
  };

  const renderStepContent = () => {
    switch (visibleStep) {
      case "queue":
        return (
          <QueueView
            tasks={tasks}
            removeTask={removeTask}
            startAtomize={startAtomize}
            animationState={animationState}
            onTaskClick={handleTaskClick}
          />
        );
      case "loading":
        return <LoadingView animationState={animationState} />;
      case "carousel":
        return atomizationData.length > 0 ? (
          <div className="flex h-full flex-col">
            <TaskAtomizationGroup
              key={currentCarouselIndex}
              item={atomizationData[currentCarouselIndex]}
              onReatomize={handleReatomize}
              onAccept={handleNextItem}
              animationState={animationState}
              direction={direction}
              isInitialRender={isInitialCarouselRender}
              onTaskClick={handleTaskClick}
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
                    {currentCarouselIndex + 1} / {atomizationData.length}
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
            atomizationData={atomizationData}
            onAccept={handleAcceptChanges}
            onCancel={handleClose}
            onBack={handleBackToCarousel}
            animationState={animationState}
            onTaskClick={handleTaskClick}
          />
        );
      default:
        return null;
    }
  };

  const getModalTitle = () => {
    switch (step) {
      case "queue":
        return "Seleccionar Tareas para Atomizar";
      case "loading":
        return "Atomizando Tareas";
      case "carousel":
        return "Revisar Subtareas Generadas";
      case "summary":
        return "Resumen de Atomización de Tareas";
      default:
        return "Atomizar Tareas";
    }
  };

  return (
    <Modal
      className="bg-oc-dark-gray-accent h-[800px] w-[900px]"
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

      {/* Add TaskDetailModal */}
      {selectedTaskForDetail && (
        <TaskDetailModal
          task={selectedTaskForDetail}
          onClose={handleTaskDetailClose}
        />
      )}
    </Modal>
  );
}

// Add these animations to your global CSS or a style tag in your app
// tailwind.config.js should include these custom animations
// These can be added to your existing Tailwind config
/*
module.exports = {
  // ...other config
  theme: {
    extend: {
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-out forwards',
        'slideInRight': 'slideInRight 0.5s ease-out forwards',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'dash': 'dash 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        dash: {
          '0%': { strokeDashoffset: '100' },
          '50%': { strokeDashoffset: '50' },
          '100%': { strokeDashoffset: '100' },
        },
      },
    },
  },
}
*/
