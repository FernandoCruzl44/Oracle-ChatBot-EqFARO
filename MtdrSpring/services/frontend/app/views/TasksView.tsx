// app/views/TasksView.tsx
import { useEffect, useState, useRef } from "react";
import React from "react";
import { toast } from "sonner";

import type { Task } from "../constants/mockData";
import TaskModal from "../components/TaskModal";
import Portal from "../components/Portal";
import CreateTaskModal from "../components/CreateTaskModal";

interface DropdownPosition {
  taskId: number;
  top: number;
  left: number;
}

export default function TaskView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Store the dropdown's taskId and its calculated coordinates
  const [openStatusMenu, setOpenStatusMenu] = useState<DropdownPosition | null>(
    null
  );
  const statusMenuRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    console.log("[DEV] Fetching data from API");
    fetch("/api/debug")
      .then((response) => response.json())
      .then((data) => console.log(data))
      .catch((error) => console.error("Error fetching data:", error));

    fetchTasks();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        statusMenuRef.current &&
        !statusMenuRef.current.contains(event.target as Node)
      ) {
        setOpenStatusMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchTasks = () => {
    setIsLoading(true);
    fetch("/api/tasks/")
      .then((res) => res.json())
      .then((data) => {
        setTasks(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching tasks:", error);
        setIsLoading(false);
      });
  };

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
    setSelectedTask(task);
  };

  const closeModal = () => {
    setSelectedTask(null);
    setIsCreateModalOpen(false);
  };

  const handleAddTaskClick = () => {
    setIsCreateModalOpen(true);
  };

  // Called when a new task is successfully created via the modal
  const handleSaveNewTask = (newTask: Task) => {
    setTasks([...tasks, newTask]);
  };

  // Delete selected tasks
  const handleDeleteTasks = () => {
    if (selectedTasks.length === 0) return;

    fetch("/api/tasks/", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(selectedTasks),
    })
      .then((response) => {
        if (response.ok) {
          const updatedTasks = tasks.filter(
            (task) => !selectedTasks.includes(task.id)
          );
          setTasks(updatedTasks);
          setSelectedTasks([]);
        } else {
          console.error("Failed to delete tasks");
        }
      })
      .catch((error) => {
        console.error("Error deleting tasks:", error);
      });
  };

  // Handle task status change
  const handleStatusChange = (taskId: number, newStatus: string) => {
    fetch(`/api/tasks/${taskId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: newStatus }),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error("Failed to update task status");
      })
      .then((updatedTask) => {
        const updatedTasks = tasks.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task
        );
        setTasks(updatedTasks);
        setOpenStatusMenu(null);
      })
      .catch((error) => {
        console.error("Error updating task status:", error);
      });
  };

  // Toggle status dropdown menu and calculate its screen position
  const toggleStatusMenu = (
    task: Task,
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

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

  // Available statuses
  const statuses = ["En progreso", "Cancelada", "Backlog", "Completada"];

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(
      tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  return (
    <div className="p-6 bg-oc-neutral h-full">
      <div className="h-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center pb-2 gap-2">
          <i className="fa fa-chevron-right text-2xl text-black"></i>
          <h1 className="text-xl font-medium text-black">Tareas</h1>
        </div>

        {/* Search and filters */}
        <div className="py-4 flex items-center justify-between">
          <div className="flex flex-row gap-2">
            <div className="relative w-72">
              <input
                type="text"
                placeholder="Buscar"
                className="w-full pl-8 pr-10 py-2 rounded-lg border border-oc-outline-light text-black bg-oc-primary text-sm"
                value={searchTerm}
                onChange={handleSearch}
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
                className="px-4 py-2 bg-oc-primary hover:bg-white rounded-lg border border-oc-outline-light flex items-center text-black text-sm"
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

          {/* <div className="flex">
            <button className="px-4 py-2 bg-oc-primary hover:bg-white rounded-lg border border-oc-outline-light flex items-center text-black text-sm">
              <i className="fa fa-sort mr-2"></i>
              <span>Ordenar</span>
            </button>
          </div> */}
        </div>

        <div className="bg-oc-primary border border-oc-outline-light rounded-lg flex-1 text-sm">
          {/* Tabs */}
          <div className="flex px-4 py-2 border-b pb-0 border-oc-outline-light/60">
            <button className="px-4 py-2 font-medium text-gray-800 border-b-2 border-gray-800">
              Mis tareas
            </button>
            <button className="px-4 py-2 text-gray-600">Proyecto</button>
          </div>

          {/* Task table */}
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
                    />
                  </td>
                  <td className="py-3 w-96 font-bold">Titulo</td>
                  <td className="py-3 w-32 font-bold">Tag</td>
                  <td className="py-3 w-32 font-bold">Estatus</td>
                  <td className="py-3 w-32 font-bold">Fecha Inicio</td>
                  <td className="py-3 w-32 font-bold">Fecha Final</td>
                  <td className="py-3 w-32 font-bold">Creada por</td>
                </tr>
              </thead>
              <tbody>
                {paginatedTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-4 px-6 text-center">
                      No hay tareas
                    </td>
                  </tr>
                ) : (
                  paginatedTasks.map((task, index) => (
                    <tr
                      key={task.id}
                      className={`border-oc-outline-light/60 hover:bg-white ${
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
                        <a
                          href="#"
                          className="hover:underline"
                          onClick={(e) => {
                            e.preventDefault();
                            handleTaskClick(task);
                          }}
                        >
                          {task.title}
                        </a>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-1 text-xs rounded-lg border border-oc-outline-light/40 ${
                            task.tag === "Feature"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {task.tag}
                        </span>
                      </td>
                      <td className="py-3">
                        <div
                          className="flex items-center cursor-pointer"
                          onClick={(e) => toggleStatusMenu(task, e)}
                        >
                          <span>{task.status || "En progreso"}</span>
                          <i className="fa fa-chevron-down ml-2 text-gray-500"></i>
                        </div>
                      </td>
                      <td className="py-3">{task.startDate}</td>
                      <td className="py-3">{task.endDate || "—"}</td>
                      <td className="py-3">{task.createdBy}</td>
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
                disabled={currentPage === 1 || filteredTasks.length === 0}
              >
                <i className="fa fa-angle-double-left"></i>
              </button>
              <button
                className="w-8 h-8 flex items-center justify-center border-t border-r border-b border-oc-outline-light"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || filteredTasks.length === 0}
              >
                <i className="fa fa-angle-left"></i>
              </button>
              <button
                className="w-8 h-8 flex items-center justify-center border-t border-b border-oc-outline-light"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={
                  currentPage === totalPages || filteredTasks.length === 0
                }
              >
                <i className="fa fa-angle-right"></i>
              </button>
              <button
                className="w-8 h-8 flex items-center justify-center border rounded-r border-oc-outline-light"
                onClick={() => setCurrentPage(totalPages)}
                disabled={
                  currentPage === totalPages || filteredTasks.length === 0
                }
              >
                <i className="fa fa-angle-double-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Task Modals */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={closeModal}
          onUpdate={handleTaskUpdate}
        />
      )}
      {isCreateModalOpen && (
        <CreateTaskModal onClose={closeModal} onSave={handleSaveNewTask} />
      )}

      {/* Render the status dropdown in a portal */}
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
            className="bg-oc-primary  rounded-md overflow-hidden border shadow-sm  border-oc-outline-light/50  w-32"
          >
            <ul>
              {statuses.map((status) => (
                <li
                  key={status}
                  className={`px-4 py-2 hover:bg-white cursor-pointer text-sm ${
                    tasks.find((t) => t.id === openStatusMenu.taskId)
                      ?.status === status
                      ? "bg-oc-neutral"
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
