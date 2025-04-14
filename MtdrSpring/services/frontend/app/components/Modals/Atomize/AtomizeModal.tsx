import { useState, useEffect, useRef } from "react";
import type { Task } from "~/types";
import { Modal } from "~/components/Modal";
import { TaskCard } from "~/views/Tasks/TaskCard";
import { Button } from "../../Button";

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
      title: "Implement user authentication system",
      tag: "Feature",
      status: "In Progress",
      startDate: "2025-04-11",
      endDate: "2025-04-20",
      creatorName: "John Doe",
      assignees: [{ id: 1, name: "John Doe" }],
    },
    generated: [
      {
        id: 11,
        title: "Setup user registration endpoints",
        tag: "Feature",
        status: "To Do",
        startDate: "2025-04-11",
        endDate: "2025-04-15",
        creatorName: "John Doe",
        assignees: [{ id: 1, name: "John Doe" }],
      },
      {
        id: 12,
        title: "Implement login functionality",
        tag: "Feature",
        status: "To Do",
        startDate: "2025-04-16",
        endDate: "2025-04-18",
        creatorName: "John Doe",
        assignees: [{ id: 1, name: "John Doe" }],
      },
      {
        id: 13,
        title: "Add password reset flow",
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
      title: "Design and implement database schema",
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
        title: "Design entity relationship diagram",
        tag: "Feature",
        status: "To Do",
        startDate: "2025-04-15",
        endDate: "2025-04-18",
        creatorName: "Jane Smith",
        assignees: [{ id: 2, name: "Jane Smith" }],
      },
      {
        id: 22,
        title: "Create SQL migration scripts",
        tag: "Feature",
        status: "To Do",
        startDate: "2025-04-18",
        endDate: "2025-04-21",
        creatorName: "Jane Smith",
        assignees: [{ id: 2, name: "Jane Smith" }],
      },
      {
        id: 23,
        title: "Implement ORM models",
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
}: {
  tasks: Task[];
  removeTask: (id: number) => void;
  startAtomize: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-oc-outline-light border-b p-4">
        <h3 className="text-lg font-medium text-white">Task Queue</h3>
        <p className="text-oc-text-gray text-sm">
          These tasks will be broken down into smaller, more manageable tasks.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {tasks.length === 0 ? (
          <div className="text-oc-text-gray flex h-full items-center justify-center">
            No tasks selected for atomization
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="group relative">
                <TaskCard
                  task={task}
                  onClick={() => {}}
                  onSelect={() => {}}
                  isSelected={false}
                  showAssignees={true}
                  sprints={[]}
                  hideSelect={true}
                />
                <Button
                  onClick={() => removeTask(task.id)}
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
          Start Atomization
        </Button>
      </div>
    </div>
  );
}

function LoadingView() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
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
      <h3 className="mb-2 text-xl font-medium text-white">Atomizing Tasks</h3>
      <p className="text-oc-text-gray max-w-md text-center">
        Our AI is analyzing your tasks and breaking them down into smaller, more
        manageable subtasks. This may take a few moments...
      </p>
    </div>
  );
}

function TaskAtomizationGroup({
  item,
  onReatomize,
  onAccept,
}: {
  item: AtomizationItem;
  onReatomize: () => void;
  onAccept: () => void;
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

  return (
    <div className="flex h-full flex-col">
      <div className="border-oc-outline-light border-b p-4">
        <h3 className="text-lg font-medium text-white">Task Breakdown</h3>
        <p className="text-oc-text-gray text-sm">
          The original task has been broken down into smaller subtasks.
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
                stroke="white" // Use your accent color here
                strokeWidth="1.5"
                strokeDasharray="5,5"
                markerEnd="url(#arrowhead)"
              />
            ))}
            {/* <defs>
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
            </defs> */}
          </svg>

          <div className="mb-16 flex h-full w-full flex-col items-center justify-center md:mb-0">
            <h3 className="text-oc-text-gray-dark mb-4 text-center text-sm font-medium">
              Original Task
            </h3>
            <div className="w-[350px]" ref={originalTaskRef}>
              <TaskCard
                task={item.original}
                onClick={() => {}}
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
              Generated Sub-Tasks
            </h3>
            <div className="flex flex-col gap-6">
              {item.generated.map((genTask, index) => (
                <div key={genTask.id}>
                  <div
                    className="w-[350px]"
                    ref={(el) => {
                      generatedTaskRefs.current[index] = el;
                    }}
                  >
                    <TaskCard
                      task={genTask}
                      onClick={() => {}}
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
          Re-Atomize
        </Button>
        <Button
          onClick={onAccept}
          className="bg-oc-accent-primary hover:bg-oc-accent-primary-dark rounded px-4 py-2 text-sm font-medium whitespace-nowrap text-white transition-colors"
        >
          Accept
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
}: {
  atomizationData: AtomizationItem[];
  onAccept: () => void;
  onCancel: () => void;
  onBack: () => void;
}) {
  const totalOriginalTasks = atomizationData.length;
  const totalGeneratedTasks = atomizationData.reduce(
    (acc, item) => acc + item.generated.length,
    0,
  );

  return (
    <div className="flex h-full flex-col">
      <div className="border-oc-outline-light border-b p-4">
        <h3 className="text-lg font-medium text-white">Summary</h3>
        <p className="text-oc-text-gray text-sm">
          {totalOriginalTasks} original task
          {totalOriginalTasks !== 1 ? "s" : ""} will be replaced with{" "}
          {totalGeneratedTasks} smaller subtask
          {totalGeneratedTasks !== 1 ? "s" : ""}.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto flex max-w-5xl flex-col justify-center gap-8 md:flex-row">
          <div className="w-[350px]">
            <h3 className="text-oc-text-gray-dark mb-4 text-center text-sm font-medium">
              Original Tasks ({totalOriginalTasks})
            </h3>
            <div className="space-y-4">
              {atomizationData.map((item) => (
                <TaskCard
                  key={item.original.id}
                  task={item.original}
                  onClick={() => {}}
                  onSelect={() => {}}
                  isSelected={false}
                  showAssignees={true}
                  sprints={[]}
                  hideSelect={true}
                />
              ))}
            </div>
          </div>

          <div className="w-[350px]">
            <h3 className="text-oc-text-gray-dark mb-4 text-center text-sm font-medium">
              Generated Tasks ({totalGeneratedTasks})
            </h3>
            <div className="space-y-4">
              {atomizationData.flatMap((item) =>
                item.generated.map((genTask) => (
                  <TaskCard
                    key={genTask.id}
                    task={genTask}
                    onClick={() => {}}
                    onSelect={() => {}}
                    isSelected={false}
                    showAssignees={true}
                    sprints={[]}
                    hideSelect={true}
                  />
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
            className="bg-oc-neutral text-oc-text-gray hover:bg-oc-neutral-light max-w-[150px] rounded px-4 py-2 text-sm font-medium transition-colors"
          >
            <i className="fa fa-arrow-left mr-2"></i>
            Back
          </Button>

          <Button
            onClick={onCancel}
            className="bg-oc-neutral text-oc-text-gray hover:bg-oc-neutral-light max-w-[150px] rounded px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors"
          >
            Cancel
          </Button>
          <Button
            onClick={onAccept}
            className="bg-oc-accent-primary hover:bg-oc-accent-primary-dark w-full rounded px-4 py-2 text-sm font-medium whitespace-nowrap text-white transition-colors"
          >
            Accept Changes
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [atomizationData, setAtomizationData] = useState<AtomizationItem[]>([]);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);

  useEffect(() => {
    if (isVisible && initialTasks.length > 0) {
      setTasks(initialTasks);
    }
  }, [isVisible, initialTasks]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      } else if (step === "carousel") {
        if (
          event.key === "ArrowRight" &&
          currentCarouselIndex < atomizationData.length - 1
        ) {
          setCurrentCarouselIndex((prev) => prev + 1);
        } else if (event.key === "ArrowLeft" && currentCarouselIndex > 0) {
          setCurrentCarouselIndex((prev) => prev - 1);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [step, onClose, currentCarouselIndex, atomizationData.length]);

  const removeTask = (id: number) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const startAtomize = () => {
    setStep("loading");

    // Simulate fetching from LLM
    setTimeout(() => {
      const generatedData = tasks.map((task) => {
        // Find matching sample or create a default one
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

        // Create default generated tasks if no sample match
        return {
          original: task,
          generated: [
            {
              id: task.id * 100 + 1,
              title: `${task.title} - Planning phase`,
              tag: task.tag,
              status: "To Do",
              startDate: task.startDate,
              endDate: task.endDate,
              creatorName: task.creatorName,
              assignees: task.assignees,
            },
            {
              id: task.id * 100 + 2,
              title: `${task.title} - Implementation phase`,
              tag: task.tag,
              status: "To Do",
              startDate: task.startDate,
              endDate: task.endDate,
              creatorName: task.creatorName,
              assignees: task.assignees,
            },
            {
              id: task.id * 100 + 3,
              title: `${task.title} - Testing phase`,
              tag: task.tag,
              status: "To Do",
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
      setStep("carousel");
    }, 500);
  };

  const handleReatomize = () => {
    setStep("loading");

    // Simulate re-fetching from LLM with slight delay
    setTimeout(() => {
      setStep("carousel");
    }, 1500);
  };

  const handleNextItem = () => {
    if (currentCarouselIndex < atomizationData.length - 1) {
      setCurrentCarouselIndex((prev) => prev + 1);
    } else {
      setStep("summary");
    }
  };

  const handlePrevItem = () => {
    if (currentCarouselIndex > 0) {
      setCurrentCarouselIndex((prev) => prev - 1);
    }
  };

  const handleBackToCarousel = () => {
    setStep("carousel");
    setCurrentCarouselIndex(atomizationData.length - 1);
  };

  const handleAcceptChanges = () => {
    // This would normally save the changes via API
    console.log("Accepting changes:", atomizationData);
    onClose();
  };

  const renderStepContent = () => {
    switch (step) {
      case "queue":
        return (
          <QueueView
            tasks={tasks}
            removeTask={removeTask}
            startAtomize={startAtomize}
          />
        );
      case "loading":
        return <LoadingView />;
      case "carousel":
        return atomizationData.length > 0 ? (
          <div className="flex h-full flex-col">
            <TaskAtomizationGroup
              item={atomizationData[currentCarouselIndex]}
              onReatomize={handleReatomize}
              onAccept={handleNextItem}
            />
            <div className="border-oc-outline-light flex items-center justify-center border-t p-4">
              <div className="flex items-center">
                <Button
                  onClick={handlePrevItem}
                  disabled={currentCarouselIndex === 0}
                  className="bg-oc-neutral text-oc-text-gray hover:bg-oc-neutral-light mr-2 flex h-8 w-8 items-center justify-center rounded disabled:opacity-50"
                >
                  <i className="fa fa-chevron-left"></i>
                </Button>
                <span className="text-oc-text-gray mx-2 w-32 text-center">
                  {currentCarouselIndex + 1} / {atomizationData.length}
                </span>
                <Button
                  onClick={handleNextItem}
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
            onCancel={onClose}
            onBack={handleBackToCarousel}
          />
        );
      default:
        return null;
    }
  };

  const getModalTitle = () => {
    switch (step) {
      case "queue":
        return "Select Tasks to Atomize";
      case "loading":
        return "Atomizing Tasks";
      case "carousel":
        return "Review Generated Subtasks";
      case "summary":
        return "Task Atomization Summary";
      default:
        return "Atomize Tasks";
    }
  };

  return (
    <Modal
      className="bg-oc-dark-gray-accent h-[80vh] w-[70vw]"
      isVisible={isVisible}
      onClose={onClose}
      handleClose={onClose}
    >
      <div className="flex h-full w-full flex-col overflow-hidden">
        <div className="border-oc-outline-light/60 bg-oc-dark-gray-accent sticky top-0 border-b p-4">
          <h2 className="text-xl font-semibold text-white">
            {getModalTitle()}
          </h2>
        </div>

        <div className="flex-1 overflow-hidden">{renderStepContent()}</div>
      </div>
    </Modal>
  );
}
