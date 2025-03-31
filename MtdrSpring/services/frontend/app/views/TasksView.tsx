// app/views/TasksView.tsx
import { useEffect, useState } from "react";
import type { Task, Sprint } from "~/types";
import TaskModal from "../components/TaskModal";
import CreateTaskModal from "../components/CreateTaskModal";
import { SprintTransitionModal } from "../components/SprintTransitionModal";
import { CreateSprintModal } from "../components/CreateSprintModal";
import { SprintSelector } from "../components/SprintSelector";
import useTaskStore from "~/store";
import TasksSkeletonLoader from "~/components/TasksSkeletonLoader";
import { generateAvatarColor } from "~/lib/generateAvatarColor";
import TaskStatusSelector from "~/components/TaskStatusSelector";

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
    sprints,
    selectedSprintId,
    selectSprint,
    fetchSprints,
    completeSprint,
    isLoadingSprints,
    getSprintsByTeam,
  } = useTaskStore();

  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isCreateSprintModalOpen, setIsCreateSprintModalOpen] = useState(false);
  const [isSprintTransitionModalOpen, setIsSprintTransitionModalOpen] =
    useState(false);
  const [transitioningSprint, setTransitioningSprint] = useState<Sprint | null>(
    null
  );

  const tasksPerPage = 15;

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
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

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());

    const months = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    const day = date.getDate().toString().padStart(2, "0");
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  useEffect(() => {
    if (sprints.length > 0 && isManager) {
      const today = new Date();
      const sprintToTransition = sprints.find((sprint) => {
        if (
          sprint.status !== "ACTIVE" ||
          sprint.id === transitioningSprint?.id
        ) {
          return false;
        }
        const endDate = new Date(sprint.endDate);
        endDate.setHours(23, 59, 59, 999);
        const daysRemaining = Math.ceil(
          (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysRemaining <= 3;
      });

      if (sprintToTransition && !isSprintTransitionModalOpen) {
        console.log(
          "Triggering transition modal for sprint:",
          sprintToTransition.name
        );
        setTransitioningSprint(sprintToTransition);
        setIsSprintTransitionModalOpen(true);
      }
    }
  }, [sprints, isManager]);

  useEffect(() => {
    if (!isInitialized) {
      initializeData();
    }
  }, [initializeData, isInitialized]);

  useEffect(() => {
    if (isInitialized && currentUser) {
      fetchTasks(activeTab);

      if (activeTab !== "all" && activeTab !== "team") {
        fetchSprints(Number(activeTab));
      } else if (activeTab === "team" && !isManager && currentUser.teamId) {
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
    setIsCreateSprintModalOpen(false);
    setIsSprintTransitionModalOpen(false);
    setTransitioningSprint(null);
  };

  const handleAddTaskClick = () => {
    setIsCreateModalOpen(true);
  };

  const handleSaveNewTask = () => {
    setIsCreateModalOpen(false);
  };

  const handleDeleteTasks = () => {
    if (selectedTasks.length === 0) return;
    deleteTasks(selectedTasks)
      .then(() => {
        setSelectedTasks([]);
      })
      .catch((error) => {
        console.error("Error deleting tasks:", error);
      });
  };

  const handleStatusChange = (taskId: number, newStatus: string) => {
    updateTaskStatus(taskId, newStatus).catch((error) => {
      console.error("Error updating task status:", error);
    });
  };

  const statuses = ["En progreso", "Cancelada", "Backlog", "Completada"];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const changeTab = (tab: string) => {
    setActiveTab(tab);
    setSearchTerm("");
    setSelectedTasks([]);
    selectSprint(null);
    setCurrentPage(1);
  };

  const getSprintName = (sprintId?: number | null): string => {
    if (!sprintId) return "—";
    const sprint = sprints.find((s) => s.id === sprintId);
    return sprint ? sprint.name : "—";
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
    } finally {
      setIsSprintTransitionModalOpen(false);
      setTransitioningSprint(null);
    }
  };

  const handleCloseTransitionModal = () => {
    setIsSprintTransitionModalOpen(false);
  };

  const getSelectorTeamId = (): number | undefined => {
    if (activeTab === "all") {
      return undefined;
    } else if (activeTab === "team") {
      return isManager ? undefined : currentUser?.teamId;
    } else {
      return Number(activeTab);
    }
  };
  const selectorTeamId = getSelectorTeamId();
  const showSprintSelector = activeTab !== "all";

  const tableHeaders = [
    { id: "checkbox", label: "", width: "w-12 px-5" },
    { id: "title", label: "Título", width: "w-80" },
    { id: "tag", label: "Tag", width: "w-28" },
    { id: "sprint", label: "Sprint", width: "w-24" },
    { id: "status", label: "Estatus", width: "w-32" },
    { id: "startDate", label: "Fecha Inicio", width: "w-32" },
    { id: "endDate", label: "Fecha Final", width: "w-32" },
    { id: "creator", label: "Creada por", width: "w-32" },
  ];

  const showAssigneesColumn =
    (isManager && activeTab !== "all") || (!isManager && activeTab === "team");
  if (showAssigneesColumn) {
    tableHeaders.push({ id: "assignees", label: "Asignada a", width: "w-32" });
  }
  const columnCount = tableHeaders.length;

  return (
    <div className="p-6 bg-oc-neutral h-full">
      <div className="h-full overflow-hidden flex flex-col">
        <div className="flex justify-between items-center pb-2 gap-2">
          <div className="flex items-center pb-2 gap-2">
            <i className="fa fa-chevron-right text-2xl text-white"></i>
            <h1 className="text-xl font-medium text-white">Tareas</h1>
          </div>
          {currentUser && (
            <div className="text-sm text-stone-300 flex items-center flex-wrap">
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

        <div className="py-4 flex items-center justify-between">
          <div className="flex flex-row gap-2 items-center">
            <div className="relative w-72">
              <input
                type="text"
                placeholder="Buscar por título"
                className="w-full pl-8 pr-10 py-2 rounded-lg border border-oc-outline-light text-white bg-oc-primary text-sm"
                value={searchTerm}
                onChange={handleSearch}
                disabled={isLoadingTasks}
              />
              <i className="fa fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-white"></i>
              {searchTerm && (
                <i
                  className="fa fa-times-circle absolute right-3 top-1/2 transform -translate-y-1/2 text-oc-brown/80 cursor-pointer"
                  onClick={() => {
                    setSearchTerm("");
                    setCurrentPage(1);
                  }}
                ></i>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddTaskClick}
                className={`px-4 py-2 bg-oc-primary hover:bg-black rounded-lg border border-oc-outline-light flex items-center text-white text-sm ${
                  isLoadingTasks ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={isLoadingTasks}
              >
                <i className="fa fa-plus mr-2"></i>
                <span>Agrega tarea</span>
              </button>

              {showSprintSelector && (
                <SprintSelector
                  teamId={selectorTeamId ?? 0}
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
                  <span>Eliminar ({selectedTasks.length})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-oc-primary border border-oc-outline-light rounded-lg flex-1 text-sm flex flex-col overflow-hidden">
          <div className="flex px-4 py-2 border-b pb-0 border-oc-outline-light/60 overflow-x-auto hide-scrollbar flex-shrink-0">
            {isManager ? (
              <>
                <button
                  className={`px-4 py-2 font-medium whitespace-nowrap ${
                    activeTab === "all"
                      ? "text-stone-100 border-b-2 border-white"
                      : "text-stone-400 hover:text-stone-200"
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
                        ? "text-stone-100 border-b-2 border-stone-200"
                        : "text-stone-400 hover:text-stone-100"
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
                      ? "text-stone-100 border-b-2 border-white"
                      : "text-stone-400 hover:text-stone-200"
                  } ${isLoadingTasks ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => !isLoadingTasks && changeTab("all")}
                  disabled={isLoadingTasks}
                >
                  Mis tareas
                </button>
                {currentUser?.teamId && (
                  <button
                    className={`px-4 py-2 font-medium ${
                      activeTab === "team"
                        ? "text-stone-100 border-b-2 border-white"
                        : "text-stone-400 hover:text-stone-200"
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
          <div className="overflow-y-auto flex-grow">
            <table className="min-w-full text-white table-fixed">
              <thead className="sticky top-0 z-10 bg-oc-primary">
                <tr style={{ boxShadow: "0 1px 0px #343231" }}>
                  {tableHeaders.map((header) => (
                    <td
                      key={header.id}
                      className={`py-3 font-bold ${header.width} ${
                        header.id === "checkbox" ? "pl-5" : "px-2"
                      }`}
                    >
                      {header.id === "checkbox" ? (
                        <input
                          type="checkbox"
                          className="w-4 h-4 translate-y-0.5"
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
                      className="py-4 px-6 text-center text-stone-500"
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
                      className={`border-oc-outline-light/60 hover:bg-stone-700/30 transition-colors ${
                        index === paginatedTasks.length - 1 ? "" : "border-b"
                      }`}
                    >
                      <td
                        className="w-12 px-5 py-3 translate-y-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4"
                          checked={selectedTasks.includes(task.id)}
                          onChange={() => handleTaskSelection(task.id)}
                        />
                      </td>
                      <td
                        className="py-3 px-2 truncate"
                        onClick={() => handleTaskClick(task)}
                      >
                        <button
                          className="hover:underline text-left"
                          onClick={(e: React.MouseEvent) => {
                            e.preventDefault();
                            handleTaskClick(task);
                          }}
                          title={task.title}
                        >
                          {task.title}
                        </button>
                      </td>
                      <td className="py-2 px-2">
                        <span
                          className={`px-2 py-1 text-xs rounded-lg border  ${
                            task.tag === "Feature"
                              ? "border-green-700/50 text-green-300"
                              : "border-red-700/50 text-red-300"
                          } inline-block w-auto text-center`}
                        >
                          {task.tag}
                        </span>
                      </td>
                      <td className="py-3 px-2 truncate">
                        <span
                          className="text-sm"
                          title={getSprintName(task.sprintId)}
                        >
                          {getSprintName(task.sprintId)}
                        </span>
                      </td>
                      <td
                        className="py-3 px-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <TaskStatusSelector
                          status={task.status || "En progreso"}
                          onStatusChange={(newStatus) =>
                            handleStatusChange(task.id, newStatus)
                          }
                          isLoading={isLoadingTasks}
                        />
                      </td>
                      <td className="py-3 px-2">
                        {formatDate(task.startDate)}
                      </td>
                      <td className="py-3 px-2">{formatDate(task.endDate)}</td>
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
                              {task.assignees.map((assignee, i) => {
                                const colors = generateAvatarColor(
                                  assignee.name
                                );
                                return (
                                  <span
                                    key={i}
                                    style={{
                                      backgroundColor: colors.backgroundColor,
                                      color: colors.color,
                                    }}
                                    className="px-1.5 py-0.5 text-xs rounded-full border border-oc-outline-light/60 whitespace-nowrap font-bold"
                                    title={assignee.name}
                                  >
                                    {assignee.name.slice(0, 1)}
                                  </span>
                                );
                              })}
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

        <div className="px-4 py-2 flex items-center justify-between text-white/50 text-sm h-12 flex-shrink-0">
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
                className="w-8 h-8 flex items-center justify-center border rounded-l border-oc-outline-light disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="w-8 h-8 flex items-center justify-center border-t border-r border-b border-oc-outline-light disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="w-8 h-8 flex items-center justify-center border-t border-b border-oc-outline-light disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="w-8 h-8 flex items-center justify-center border rounded-r border-oc-outline-light disabled:opacity-50 disabled:cursor-not-allowed"
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

      {selectedTask && <TaskModal task={selectedTask} onClose={closeModal} />}
      {isCreateModalOpen && (
        <CreateTaskModal onClose={closeModal} onSave={handleSaveNewTask} />
      )}
      {isCreateSprintModalOpen && isManager && (
        <CreateSprintModal
          teamId={Number(activeTab)}
          onClose={() => setIsCreateSprintModalOpen(false)}
          onSave={() => {
            fetchSprints(Number(activeTab));
            setIsCreateSprintModalOpen(false);
          }}
        />
      )}
      {transitioningSprint && isSprintTransitionModalOpen && isManager && (
        <SprintTransitionModal
          sprint={transitioningSprint}
          onClose={handleCloseTransitionModal}
          onComplete={handleCompleteSprint}
        />
      )}
    </div>
  );
}
