// app/views/TasksView.tsx
import { useEffect, useState, useRef } from "react";
import type { Task, Sprint } from "~/types";
import TaskModal from "../components/TaskModal"; // Assuming TaskModal is default export
import Portal from "../components/Portal"; // Assuming Portal is default export
import CreateTaskModal from "../components/CreateTaskModal"; // Assuming CreateTaskModal is default export
import { SprintTransitionModal } from "../components/SprintTransitionModal";
import { CreateSprintModal } from "../components/CreateSprintModal";
import { SprintSelector } from "../components/SprintSelector";
import useTaskStore from "~/store";
import TasksSkeletonLoader from "~/components/TasksSkeletonLoader"; // Assuming TasksSkeletonLoader is default export

interface DropdownPosition {
  taskId: number;
  top: number;
  left: number;
}

export default function TaskView() {
  const {
    tasks,
    currentUser,
    teams,
    isLoadingTasks,
    isInitialized,
    error,
    initializeData,
    fetchTasks,
    updateTaskStatus,
    selectTask,
    selectedTaskId,
    getTaskById,
    deleteTasks,
    // Sprint related store methods
    sprints, // This holds ALL fetched sprints
    selectedSprintId,
    selectSprint,
    fetchSprints,
    // fetchSprintTasks, // Not directly used in this view logic
    completeSprint,
    isLoadingSprints,
    getSprintsByTeam, // Keep this for filtering within selector if needed
  } = useTaskStore();

  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [openStatusMenu, setOpenStatusMenu] = useState<DropdownPosition | null>(
    null
  );
  const [isCreateSprintModalOpen, setIsCreateSprintModalOpen] = useState(false);
  const [isSprintTransitionModalOpen, setIsSprintTransitionModalOpen] =
    useState(false);
  // Store the sprint currently being transitioned to avoid immediate re-opening
  const [transitioningSprint, setTransitioningSprint] = useState<Sprint | null>(
    null
  );

  const statusMenuRef = useRef<HTMLDivElement>(null);
  const currentToggleRef = useRef<HTMLDivElement | null>(null);
  const tasksPerPage = 15;

  // Filter tasks based on search term and selected sprint
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    // Filter by sprint applies regardless of the tab, but only if a sprint is selected
    const matchesSprint = selectedSprintId
      ? task.sprintId === selectedSprintId
      : true;
    return matchesSearch && matchesSprint;
  });

  const startIndex = (currentPage - 1) * tasksPerPage;
  const paginatedTasks = filteredTasks.slice(
    startIndex,
    startIndex + tasksPerPage
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredTasks.length / tasksPerPage)
  );

  const isManager = currentUser?.role === "manager";
  const selectedTask = selectedTaskId ? getTaskById(selectedTaskId) : null;

  // Check for sprints that need transition (always check for managers)
  useEffect(() => {
    if (sprints.length > 0 && isManager) {
      const today = new Date();
      // Find the *first* active sprint ending soon that isn't already being transitioned
      const sprintToTransition = sprints.find((sprint) => {
        if (
          sprint.status !== "ACTIVE" ||
          sprint.id === transitioningSprint?.id
        ) {
          return false;
        }
        const endDate = new Date(sprint.endDate);
        // Set time to end of day for comparison
        endDate.setHours(23, 59, 59, 999);
        const daysRemaining = Math.ceil(
          (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        // Trigger if ending today or within next 3 days, or if already past end date
        return daysRemaining <= 3;
      });

      // Only open if a suitable sprint is found AND the modal isn't already open for another sprint
      if (sprintToTransition && !isSprintTransitionModalOpen) {
        console.log(
          "Triggering transition modal for sprint:",
          sprintToTransition.name
        );
        setTransitioningSprint(sprintToTransition); // Set the sprint being transitioned
        setIsSprintTransitionModalOpen(true);
      }
    }
    // Depend on sprints and isManager. Don't depend on isSprintTransitionModalOpen or transitioningSprint here
    // to ensure it always checks when sprints/role changes.
  }, [sprints, isManager]);

  // Initialize data
  useEffect(() => {
    if (!isInitialized) {
      initializeData(); // initializeData now fetches all sprints
    }
  }, [initializeData, isInitialized]);

  // Fetch tasks and potentially team-specific sprints when tab changes
  useEffect(() => {
    if (isInitialized && currentUser) {
      // Fetch tasks based on view mode
      fetchTasks(activeTab); // Pass only activeTab, backend logic handles filtering

      // Fetch sprints relevant to the current view
      // No need to fetch all sprints here, initializeData handles that
      if (activeTab !== "all" && activeTab !== "team") {
        // Fetch sprints for a specific team ID tab
        fetchSprints(Number(activeTab));
      } else if (activeTab === "team" && !isManager && currentUser.teamId) {
        // Fetch sprints for the user's team if they are not a manager and on the 'team' tab
        fetchSprints(currentUser.teamId);
      }
    }
  }, [
    isInitialized,
    currentUser,
    activeTab,
    fetchTasks,
    fetchSprints,
    isManager,
  ]);

  // Click outside handler for status dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        statusMenuRef.current &&
        !statusMenuRef.current.contains(event.target as Node) &&
        currentToggleRef.current &&
        !currentToggleRef.current.contains(event.target as Node)
      ) {
        setOpenStatusMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // --- Event Handlers ---

  const handleTaskSelection = (taskId: number) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSelectAll = () => {
    setSelectedTasks((prev) =>
      prev.length === paginatedTasks.length
        ? []
        : paginatedTasks.map((task) => task.id)
    );
  };

  const handleTaskClick = (task: Task) => {
    selectTask(task.id);
  };

  const closeModal = () => {
    selectTask(null);
    setIsCreateModalOpen(false);
    // Also close sprint modals if needed, though they have their own close logic
    setIsCreateSprintModalOpen(false);
    setIsSprintTransitionModalOpen(false);
    setTransitioningSprint(null); // Reset transitioning sprint when any modal closes
  };

  const handleAddTaskClick = () => {
    setIsCreateModalOpen(true);
  };

  const handleSaveNewTask = () => {
    setIsCreateModalOpen(false);
    // Optionally refetch tasks if needed, though createTask should update state
  };

  const handleDeleteTasks = () => {
    if (selectedTasks.length === 0) return;
    deleteTasks(selectedTasks)
      .then(() => {
        setSelectedTasks([]);
      })
      .catch((error) => {
        console.error("Error deleting tasks:", error);
        // Add user feedback (e.g., toast notification)
      });
  };

  const handleStatusChange = (taskId: number, newStatus: string) => {
    updateTaskStatus(taskId, newStatus)
      .then(() => {
        setOpenStatusMenu(null);
      })
      .catch((error) => {
        console.error("Error updating task status:", error);
        // Add user feedback
      });
  };

  const toggleStatusMenu = (
    task: Task,
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    currentToggleRef.current = e.currentTarget;

    setOpenStatusMenu((prev) =>
      prev && prev.taskId === task.id
        ? null
        : {
            taskId: task.id,
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX,
          }
    );
  };

  const statuses = ["En progreso", "Cancelada", "Backlog", "Completada"];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset page on new search
  };

  const changeTab = (tab: string) => {
    setActiveTab(tab);
    setSearchTerm("");
    setSelectedTasks([]);
    selectSprint(null); // Reset sprint selection when changing tabs
    setCurrentPage(1); // Reset page on tab change
  };

  const getSprintName = (sprintId?: number | null): string => {
    if (!sprintId) return "—";
    const sprint = sprints.find((s) => s.id === sprintId);
    return sprint ? sprint.name : "Desconocido"; // Handle case where sprint might not be loaded yet
  };

  const handleCompleteSprint = async (
    action: "moveToBacklog" | "moveToNextSprint",
    nextSprintId?: number
  ) => {
    if (!transitioningSprint) return;
    try {
      await completeSprint(
        transitioningSprint.id,
        action,
        nextSprintId,
        activeTab
      );
    } catch (error) {
      console.error("Error completing sprint:", error);
      // Add user feedback
    } finally {
      setIsSprintTransitionModalOpen(false);
      setTransitioningSprint(null); // Reset after completion attempt
    }
  };

  const handleCloseTransitionModal = () => {
    setIsSprintTransitionModalOpen(false);
    // Keep transitioningSprint set so the effect doesn't immediately reopen for the same sprint
    // It will be reset naturally when the effect runs again and doesn't find this sprint ending
  };

  // Determine the team ID for the SprintSelector based on the current view
  // Returns undefined if the selector shouldn't be shown for the current tab/role
  const getSelectorTeamId = (): number | undefined => {
    if (activeTab === "all") {
      return undefined; // Selector not shown in 'all' view
    } else if (activeTab === "team") {
      // Show for manager (all teams) or user (their team)
      return isManager ? undefined : currentUser?.teamId;
    } else {
      // Specific team tab (only managers see these tabs)
      return Number(activeTab);
    }
  };
  const selectorTeamId = getSelectorTeamId();
  // Determine if the sprint selector should be visible at all
  const showSprintSelector = activeTab !== "all"; // Don't show on 'all' tab

  // Table headers configuration
  const tableHeaders = [
    { id: "checkbox", label: "", width: "w-12 px-5" }, // Added padding
    { id: "title", label: "Título", width: "w-80" },
    { id: "tag", label: "Tag", width: "w-28" },
    { id: "sprint", label: "Sprint", width: "w-40" },
    { id: "status", label: "Estatus", width: "w-32" }, // Increased width slightly
    { id: "startDate", label: "Fecha Inicio", width: "w-32" }, // Increased width slightly
    { id: "endDate", label: "Fecha Final", width: "w-32" }, // Increased width slightly
    { id: "creator", label: "Creada por", width: "w-32" }, // Increased width slightly
  ];

  // Conditionally add Assignees column
  const showAssigneesColumn =
    (isManager && activeTab !== "all") || (!isManager && activeTab === "team");
  if (showAssigneesColumn) {
    tableHeaders.push({ id: "assignees", label: "Asignada a", width: "w-32" }); // Increased width slightly
  }
  const columnCount = tableHeaders.length;

  return (
    <div className="p-6 bg-oc-neutral h-full">
      <div className="h-full overflow-hidden flex flex-col">
        {/* Header Section */}
        <div className="flex justify-between items-center pb-2 gap-2">
          <div className="flex items-center pb-2 gap-2">
            <i className="fa fa-chevron-right text-2xl text-black"></i>
            <h1 className="text-xl font-medium text-black">Tareas</h1>
          </div>
          {currentUser && (
            <div className="text-sm text-gray-600 flex items-center flex-wrap">
              {/* Added flex-wrap */}
              <span className="font-medium">{currentUser.name}</span>
              <span className="mx-2">•</span>
              <span
                className={`${
                  isManager ? "text-blue-600" : "text-green-600"
                } font-medium`}
              >
                {isManager ? "Manager" : "Developer"}
              </span>
              {!isManager && currentUser.teamName && (
                <>
                  <span className="mx-2">•</span>
                  <span className="text-cyan-600 font-medium">
                    {currentUser.teamName}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Controls Section */}
        <div className="py-4 flex items-center justify-between">
          <div className="flex flex-row gap-2 items-center">
            {/* Added items-center */}
            {/* Search Input */}
            <div className="relative w-72">
              <input
                type="text"
                placeholder="Buscar por título"
                className="w-full pl-8 pr-10 py-2 rounded-lg border border-oc-outline-light text-black bg-oc-primary text-sm"
                value={searchTerm}
                onChange={handleSearch}
                disabled={isLoadingTasks}
              />
              <i className="fa fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-black"></i>{" "}
              {/* Centered icon */}
              {searchTerm && (
                <i
                  className="fa fa-times-circle absolute right-3 top-1/2 transform -translate-y-1/2 text-oc-brown/80 cursor-pointer" // Centered icon
                  onClick={() => {
                    setSearchTerm("");
                    setCurrentPage(1);
                  }}
                ></i>
              )}
            </div>
            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleAddTaskClick}
                className={`px-4 py-2 bg-oc-primary hover:bg-white rounded-lg border border-oc-outline-light flex items-center text-black text-sm ${
                  isLoadingTasks ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={isLoadingTasks}
              >
                <i className="fa fa-plus mr-2"></i>
                <span>Agrega tarea</span>
              </button>

              {/* Sprint Selector - Conditionally Rendered */}
              {showSprintSelector && (
                <SprintSelector
                  teamId={selectorTeamId ?? 0} // Pass appropriate teamId or undefined
                  selectedSprintId={selectedSprintId}
                  onSelectSprint={selectSprint}
                  onCreateSprint={
                    isManager
                      ? () => setIsCreateSprintModalOpen(true)
                      : () => {}
                  }
                  isLoading={isLoadingSprints}
                />
              )}

              {selectedTasks.length > 0 && (
                <button
                  onClick={handleDeleteTasks}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg border border-oc-outline-light flex items-center text-red-700 text-sm"
                >
                  <i className="fa fa-trash mr-2"></i>
                  <span>Eliminar ({selectedTasks.length})</span>{" "}
                  {/* Show count */}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-oc-primary border border-oc-outline-light rounded-lg flex-1 text-sm flex flex-col overflow-hidden">
          {/* Added flex flex-col */}
          {/* Tabs */}
          <div className="flex px-4 py-2 border-b pb-0 border-oc-outline-light/60 overflow-x-auto hide-scrollbar flex-shrink-0">
            {/* Added flex-shrink-0 */}
            {isManager ? (
              <>
                <button
                  className={`px-4 py-2 font-medium whitespace-nowrap ${
                    activeTab === "all"
                      ? "text-gray-800 border-b-2 border-gray-800"
                      : "text-gray-600 hover:text-gray-800" // Added hover
                  } ${isLoadingTasks ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => !isLoadingTasks && changeTab("all")}
                  disabled={isLoadingTasks}
                >
                  Todas las tareas
                </button>
                {teams.map((team) => (
                  <button
                    key={team.id}
                    className={`px-4 py-2 font-medium whitespace-nowrap ${
                      activeTab === String(team.id)
                        ? "text-gray-800 border-b-2 border-gray-800"
                        : "text-gray-600 hover:text-gray-800" // Added hover
                    } ${isLoadingTasks ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() =>
                      !isLoadingTasks && changeTab(String(team.id))
                    }
                    disabled={isLoadingTasks}
                  >
                    {team.name}
                  </button>
                ))}
              </>
            ) : (
              <>
                <button
                  className={`px-4 py-2 font-medium ${
                    activeTab === "all"
                      ? "text-gray-800 border-b-2 border-gray-800"
                      : "text-gray-600 hover:text-gray-800" // Added hover
                  } ${isLoadingTasks ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => !isLoadingTasks && changeTab("all")}
                  disabled={isLoadingTasks}
                >
                  Mis tareas
                </button>
                {currentUser?.teamId && ( // Only show team tab if user has a team
                  <button
                    className={`px-4 py-2 font-medium ${
                      activeTab === "team"
                        ? "text-gray-800 border-b-2 border-gray-800"
                        : "text-gray-600 hover:text-gray-800" // Added hover
                    } ${isLoadingTasks ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => !isLoadingTasks && changeTab("team")}
                    disabled={isLoadingTasks}
                  >
                    Proyecto
                  </button>
                )}
              </>
            )}
          </div>
          {/* Table Area */}
          <div
            className="overflow-y-auto flex-grow" // Changed to flex-grow
            // style={{ maxHeight: "calc(100vh - 253px)" }} // Removed fixed max height
          >
            <table className="min-w-full text-black table-fixed">
              <thead className="sticky top-0 z-10 bg-oc-primary">
                {/* Added sticky thead */}
                <tr style={{ boxShadow: "0 1px 0px #D1D0CE" }}>
                  {tableHeaders.map((header) => (
                    <td
                      key={header.id}
                      className={`py-3 font-bold ${header.width} ${
                        header.id === "checkbox" ? "pl-5" : "px-2"
                      }`} // Adjusted padding
                    >
                      {header.id === "checkbox" ? (
                        <input
                          type="checkbox"
                          className="w-4 h-4"
                          onChange={handleSelectAll}
                          checked={
                            paginatedTasks.length > 0 &&
                            selectedTasks.length === paginatedTasks.length
                          }
                          disabled={
                            isLoadingTasks || paginatedTasks.length === 0
                          }
                        />
                      ) : (
                        header.label
                      )}
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoadingTasks ? (
                  <TasksSkeletonLoader
                    columns={columnCount}
                    rows={tasksPerPage}
                  />
                ) : error ? (
                  <tr>
                    <td
                      colSpan={columnCount}
                      className="py-4 px-6 text-center text-red-500"
                    >
                      <div className="flex justify-center items-center">
                        <i className="fa fa-exclamation-circle mr-2"></i>
                        {error}
                      </div>
                    </td>
                  </tr>
                ) : paginatedTasks.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columnCount}
                      className="py-4 px-6 text-center text-gray-500" // Adjusted color
                    >
                      <div className="flex justify-center items-center">
                        <i className="fa fa-info-circle mr-2"></i>
                        {searchTerm
                          ? "No hay tareas que coincidan con la búsqueda"
                          : "No hay tareas para mostrar"}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedTasks.map((task, index) => (
                    <tr
                      key={task.id}
                      className={`border-oc-outline-light/60 hover:bg-gray-50 ${
                        // Simplified hover
                        index === paginatedTasks.length - 1 ? "" : "border-b"
                      }`}
                    >
                      <td
                        className="w-12 px-5 py-3" // Removed translate
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4"
                          checked={selectedTasks.includes(task.id)}
                          onChange={() => handleTaskSelection(task.id)}
                        />
                      </td>
                      <td className="py-3 px-2 truncate">
                        {/* Added truncate */}
                        <button
                          className="hover:underline text-left"
                          onClick={(e: React.MouseEvent) => {
                            e.preventDefault();
                            handleTaskClick(task);
                          }}
                          title={task.title} // Add title for full text on hover
                        >
                          {task.title}
                        </button>
                      </td>
                      <td className="py-2 px-2">
                        <span
                          className={`px-2 py-1 text-xs rounded-lg border border-oc-outline-light/40 ${
                            task.tag === "Feature"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          } inline-block w-auto text-center`} // Adjusted width
                        >
                          {task.tag}
                        </span>
                      </td>
                      <td className="py-3 px-2 truncate">
                        {/* Added truncate */}
                        <span
                          className="text-sm"
                          title={getSprintName(task.sprintId)}
                        >
                          {getSprintName(task.sprintId)}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div
                          className="flex items-center cursor-pointer group" // Added group for hover effect
                          onClick={(e) => toggleStatusMenu(task, e)}
                        >
                          <span
                            className="select-none w-full truncate"
                            title={task.status || "En progreso"}
                          >
                            {/* Added truncate and title */}
                            {task.status || "En progreso"}
                          </span>
                          <i className="fa fa-chevron-down text-gray-400 group-hover:text-gray-600 ml-1"></i>{" "}
                          {/* Adjusted color */}
                        </div>
                      </td>
                      <td className="py-3 px-2">{task.startDate}</td>
                      <td className="py-3 px-2">{task.endDate || "—"}</td>
                      <td
                        className="py-3 px-2 truncate"
                        title={task.creatorName || "—"}
                      >
                        {task.creatorName || "—"}
                      </td>
                      {showAssigneesColumn ? (
                        <td className="py-3 px-2">
                          {task.assignees && task.assignees.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {task.assignees.map((assignee, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-lg border border-oc-outline-light/60 whitespace-nowrap" // Added nowrap
                                  title={
                                    typeof assignee === "object"
                                      ? assignee.name
                                      : assignee
                                  }
                                >
                                  {typeof assignee === "object"
                                    ? assignee.name
                                    : assignee}
                                </span>
                              ))}
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                      ) : null}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer / Pagination */}
        <div className="px-4 py-2 flex items-center justify-between text-black text-sm h-12  flex-shrink-0">
          {/* Added border-t and flex-shrink-0 */}
          <div>
            {selectedTasks.length} seleccionada
            {selectedTasks.length !== 1 ? "s" : ""}
          </div>
          <div className="flex items-center">
            <span className="mr-4">
              Página {filteredTasks.length > 0 ? currentPage : 0} de{" "}
              {totalPages}
            </span>
            <span className="mr-4">{tasksPerPage} tareas por página</span>
            <div className="flex">
              <button
                className="w-8 h-8 flex items-center justify-center border rounded-l border-oc-outline-light disabled:opacity-50 disabled:cursor-not-allowed" // Added disabled styles
                onClick={() => setCurrentPage(1)}
                disabled={
                  currentPage === 1 ||
                  filteredTasks.length === 0 ||
                  isLoadingTasks
                }
              >
                <i className="fa fa-angle-double-left"></i>
              </button>
              <button
                className="w-8 h-8 flex items-center justify-center border-t border-r border-b border-oc-outline-light disabled:opacity-50 disabled:cursor-not-allowed" // Added disabled styles
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={
                  currentPage === 1 ||
                  filteredTasks.length === 0 ||
                  isLoadingTasks
                }
              >
                <i className="fa fa-angle-left"></i>
              </button>
              <button
                className="w-8 h-8 flex items-center justify-center border-t border-b border-oc-outline-light disabled:opacity-50 disabled:cursor-not-allowed" // Added disabled styles
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={
                  currentPage === totalPages ||
                  filteredTasks.length === 0 ||
                  isLoadingTasks
                }
              >
                <i className="fa fa-angle-right"></i>
              </button>
              <button
                className="w-8 h-8 flex items-center justify-center border rounded-r border-oc-outline-light disabled:opacity-50 disabled:cursor-not-allowed" // Added disabled styles
                onClick={() => setCurrentPage(totalPages)}
                disabled={
                  currentPage === totalPages ||
                  filteredTasks.length === 0 ||
                  isLoadingTasks
                }
              >
                <i className="fa fa-angle-double-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedTask && <TaskModal task={selectedTask} onClose={closeModal} />}
      {isCreateModalOpen && (
        <CreateTaskModal onClose={closeModal} onSave={handleSaveNewTask} />
      )}
      {isCreateSprintModalOpen &&
        isManager && ( // Ensure only managers can open create sprint modal
          <CreateSprintModal
            teamId={Number(activeTab)} // This might need adjustment if activeTab is 'all' or 'team'
            onClose={() => setIsCreateSprintModalOpen(false)}
            onSave={() => {
              fetchSprints(Number(activeTab)); // Refetch sprints for the current team
              setIsCreateSprintModalOpen(false);
            }}
          />
        )}
      {transitioningSprint &&
        isSprintTransitionModalOpen &&
        isManager && ( // Ensure only managers see transition modal
          <SprintTransitionModal
            sprint={transitioningSprint}
            onClose={handleCloseTransitionModal} // Use specific close handler
            onComplete={handleCompleteSprint}
          />
        )}

      {/* Status dropdown portal */}
      {openStatusMenu && (
        <Portal>
          <div
            ref={statusMenuRef}
            style={{
              position: "absolute",
              top: openStatusMenu.top + 5,
              left: openStatusMenu.left,
              zIndex: 50,
            }}
            className="bg-white rounded-md shadow-lg overflow-hidden border border-oc-outline-light/50 w-36" // Increased width slightly
          >
            <ul>
              {statuses.map((status) => (
                <li
                  key={status}
                  className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm ${
                    // Simplified hover
                    tasks.find((t) => t.id === openStatusMenu.taskId)
                      ?.status === status
                      ? "font-medium text-blue-600" // Highlight selected
                      : ""
                  }`}
                  onClick={() =>
                    handleStatusChange(openStatusMenu.taskId, status)
                  }
                >
                  {status}
                </li>
              ))}
            </ul>
          </div>
        </Portal>
      )}
    </div>
  );
}
