// app/views/TasksView.tsx
import { useEffect, useState, useRef } from "react";
import React from "react";
import type { Task } from "~/types";
import TaskModal from "../components/TaskModal";
import Portal from "../components/Portal";
import CreateTaskModal from "../components/CreateTaskModal";
import useTaskStore from "~/store/index";
import TasksSkeletonLoader from "~/components/TasksSkeletonLoader";

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
  } = useTaskStore();

  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [openStatusMenu, setOpenStatusMenu] = useState<DropdownPosition | null>(
    null
  );

  const statusMenuRef = useRef<HTMLDivElement>(null);
  const currentToggleRef = useRef<HTMLDivElement | null>(null);
  const tasksPerPage = 15;

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  useEffect(() => {
    if (!isInitialized) {
      initializeData();
    }
  }, [initializeData, isInitialized]);

  useEffect(() => {
    if (isInitialized && currentUser) {
      fetchTasks(activeTab, activeTab !== "all" ? activeTab : undefined);
    }
  }, [isInitialized, currentUser, activeTab, fetchTasks]);

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

  const handleTaskSelection = (taskId: number) => {
    if (selectedTasks.includes(taskId)) {
      setSelectedTasks(selectedTasks.filter((id) => id !== taskId));
    } else {
      setSelectedTasks([...selectedTasks, taskId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedTasks.length === paginatedTasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(paginatedTasks.map((task) => task.id));
    }
  };

  const handleTaskClick = (task: Task) => {
    selectTask(task.id);
  };

  const closeModal = () => {
    selectTask(null);
    setIsCreateModalOpen(false);
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
    updateTaskStatus(taskId, newStatus)
      .then(() => {
        setOpenStatusMenu(null);
      })
      .catch((error) => {
        console.error("Error updating task status:", error);
      });
  };

  const toggleStatusMenu = (
    task: Task,
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

    // Store reference to the current toggle button
    currentToggleRef.current = e.currentTarget;

    if (openStatusMenu && openStatusMenu.taskId === task.id) {
      setOpenStatusMenu(null);
    } else {
      setOpenStatusMenu({
        taskId: task.id,
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
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
  };

  return (
    <div className="p-6 bg-oc-neutral h-full">
      <div className="h-full overflow-hidden flex flex-col">
        <div className="flex justify-between items-center pb-2 gap-2">
          <div className="flex items-center pb-2 gap-2">
            <i className="fa fa-chevron-right text-2xl text-black"></i>
            <h1 className="text-xl font-medium text-black">Tareas</h1>
          </div>
          {currentUser && (
            <div className="text-sm text-gray-600 flex items-center">
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
          <div className="flex flex-row gap-2">
            <div className="relative w-72">
              <input
                type="text"
                placeholder="Buscar"
                className="w-full pl-8 pr-10 py-2 rounded-lg border border-oc-outline-light text-black bg-oc-primary text-sm"
                value={searchTerm}
                onChange={handleSearch}
                disabled={isLoadingTasks}
              />
              <i className="fa fa-search absolute left-3 top-3 text-black"></i>
              {searchTerm && (
                <i
                  className="fa fa-times-circle absolute right-3 top-3 text-oc-brown/80 cursor-pointer -translate-y-[1px]"
                  onClick={() => {
                    setSearchTerm("");
                    setCurrentPage(1);
                  }}
                ></i>
              )}
            </div>

            <div className="flex">
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
              {selectedTasks.length > 0 && (
                <button
                  onClick={handleDeleteTasks}
                  className="ml-2 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg border border-oc-outline-light flex items-center text-red-700 text-sm"
                >
                  <i className="fa fa-trash mr-2"></i>
                  <span>Eliminar</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-oc-primary border border-oc-outline-light rounded-lg flex-1 text-sm">
          <div className="flex px-4 py-2 border-b pb-0 border-oc-outline-light/60 overflow-x-auto hide-scrollbar">
            {isManager ? (
              <>
                <button
                  className={`px-4 py-2 font-medium whitespace-nowrap ${
                    activeTab === "all"
                      ? "text-gray-800 border-b-2 border-gray-800"
                      : "text-gray-600"
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
                        : "text-gray-600"
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
                      : "text-gray-600"
                  } ${isLoadingTasks ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => !isLoadingTasks && changeTab("all")}
                  disabled={isLoadingTasks}
                >
                  Mis tareas
                </button>
                <button
                  className={`px-4 py-2 font-medium ${
                    activeTab === "team"
                      ? "text-gray-800 border-b-2 border-gray-800"
                      : "text-gray-600"
                  } ${isLoadingTasks ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => !isLoadingTasks && changeTab("team")}
                  disabled={isLoadingTasks}
                >
                  Proyecto
                </button>
              </>
            )}
          </div>

          <div
            className="overflow-y-auto"
            style={{ maxHeight: "calc(100vh - 253px)" }}
          >
            <table className="min-w-full text-black table-fixed">
              <thead>
                <tr
                  className="sticky top-0 z-10 bg-oc-primary"
                  style={{ boxShadow: "0 1px 0px #D1D0CE" }}
                >
                  <td className="w-12 px-5 py-3 translate-y-0.5">
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      onChange={handleSelectAll}
                      checked={
                        selectedTasks.length === paginatedTasks.length &&
                        paginatedTasks.length > 0
                      }
                      disabled={isLoadingTasks}
                    />
                  </td>
                  <td className="py-3 w-96 font-bold">Titulo</td>
                  <td className="py-3 w-32 font-bold">Tag</td>
                  <td className="py-3 w-32 font-bold">Estatus</td>
                  <td className="py-3 w-32 font-bold">Fecha Inicio</td>
                  <td className="py-3 w-32 font-bold">Fecha Final</td>
                  <td className="py-3 w-32 font-bold">Creada por</td>
                  {(isManager && activeTab !== "all") ||
                  (!isManager && activeTab === "team") ? (
                    <td className="py-3 w-32 font-bold">Asignada a</td>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {isLoadingTasks ? (
                  <TasksSkeletonLoader
                    columns={
                      (isManager && activeTab !== "all") ||
                      (!isManager && activeTab === "team")
                        ? 8
                        : 7
                    }
                    rows={5}
                  />
                ) : error ? (
                  <tr>
                    <td
                      colSpan={
                        (isManager && activeTab !== "all") ||
                        (!isManager && activeTab === "team")
                          ? 8
                          : 7
                      }
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
                      colSpan={
                        (isManager && activeTab !== "all") ||
                        (!isManager && activeTab === "team")
                          ? 8
                          : 7
                      }
                      className="py-4 px-6 text-center"
                    >
                      <div className="flex justify-center items-center">
                        <i className="fa fa-info-circle mr-2"></i>
                        No hay tareas
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedTasks.map((task, index) => (
                    <tr
                      key={task.id}
                      className={`border-oc-outline-light/60 ${
                        openStatusMenu && openStatusMenu.taskId === task.id
                          ? "bg-white"
                          : "hover:bg-white"
                      } ${
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
                      <td className="py-3">
                        <button
                          className="hover:underline text-left"
                          onClick={(e: React.MouseEvent) => {
                            e.preventDefault();
                            handleTaskClick(task);
                          }}
                        >
                          {task.title}
                        </button>
                      </td>
                      <td className="py-2">
                        <span
                          className={`px-2 py-1 text-xs rounded-lg border border-oc-outline-light/40 ${
                            task.tag === "Feature"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          } inline-block w-18 text-center`}
                        >
                          {task.tag}
                        </span>
                      </td>
                      <td className="py-3">
                        <div
                          className="flex items-center cursor-pointer"
                          onClick={(e) => toggleStatusMenu(task, e)}
                        >
                          <span className="select-non w-[110px]">
                            {task.status || "En progreso"}
                          </span>
                          <i className="fa fa-chevron-down text-gray-500"></i>
                        </div>
                      </td>
                      <td className="py-3">{task.startDate}</td>
                      <td className="py-3">{task.endDate || "—"}</td>
                      <td className="py-3">{task.creatorName || "—"}</td>
                      {(isManager && activeTab !== "all") ||
                      (!isManager && activeTab === "team") ? (
                        <td className="py-3">
                          {task.assignees && task.assignees.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {task.assignees.map((assignee, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-lg border border-oc-outline-light/60"
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
        <div className="px-4 py-2 flex items-center justify-between text-black text-sm h-12">
          <div>{selectedTasks.length} seleccionadas</div>
          <div className="flex items-center">
            <span className="mr-4">
              Página {filteredTasks.length > 0 ? currentPage : 0} de{" "}
              {totalPages}
            </span>
            <span className="mr-4">{tasksPerPage} tareas por página</span>
            <div className="flex">
              <button
                className="w-8 h-8 flex items-center justify-center border rounded-l border-oc-outline-light"
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
                className="w-8 h-8 flex items-center justify-center border-t border-r border-b border-oc-outline-light"
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
                className="w-8 h-8 flex items-center justify-center border-t border-b border-oc-outline-light"
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
                className="w-8 h-8 flex items-center justify-center border rounded-r border-oc-outline-light"
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
            className="bg-white rounded-md overflow-hidden border border-oc-outline-light/50 w-32"
          >
            <ul>
              {statuses.map((status) => (
                <li
                  key={status}
                  className={`px-4 py-2 bg-white border hover:border-black/30 rounded-md cursor-pointer text-sm transition-all ${
                    tasks.find((t) => t.id === openStatusMenu.taskId)
                      ?.status === status
                      ? "border-black/50 bg-white"
                      : "border-white"
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
