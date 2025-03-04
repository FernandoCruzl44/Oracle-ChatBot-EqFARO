// app/views/TaskView.tsx
import { useEffect, useState } from "react";
import { mockTasks } from "../constants/mockData";
import type { Task } from "../constants/mockData";

export default function TaskView() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const tasksPerPage = 8;

  const startIndex = (currentPage - 1) * tasksPerPage;
  const paginatedTasks = tasks.slice(startIndex, startIndex + tasksPerPage);
  const totalPages = Math.ceil(tasks.length / tasksPerPage);

  useEffect(() => {
    fetch("http://localhost:8080/debug/")
      .then((response) => response.json())
      .then((data) => console.log(data))
      .catch((error) => console.error("Error fetching data:", error));
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

  return (
    <div className="p-6 bg-oc-neutral h-full">
      <div className="h-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center p-4 px-0 gap-2">
          <i className="fa fa-chevron-right text-2xl text-black"></i>
          <h1 className="text-xl font-medium text-black">Tareas</h1>
        </div>

        {/* Search and filters */}
        <div className="py-4 flex items-center justify-between">
          <div className="w-72">
            <div className="relative ">
              <input
                type="text"
                placeholder="Buscar"
                className="w-full pl-8 pr-4 py-2 rounded-lg border border-oc-outline-light text-black bg-oc-primary text-sm"
              />
              <i className="fa fa-search absolute left-3 top-3 text-black"></i>
            </div>
          </div>
          <div className="flex">
            <button className="px-4 py-2 bg-oc-primary hover:bg-white rounded-lg border border-oc-outline-light flex items-center text-black text-sm">
              <i className="fa fa-sort mr-2"></i>
              <span>Ordenar</span>
            </button>
          </div>
        </div>

        <div className="bg-oc-primary border border-oc-outline-light rounded-lg flex-1 text-sm">
          {/* Tabs */}
          <div className="flex px-4 py-2">
            <button className="px-4 py-2 font-medium text-gray-800 border-b-2 border-gray-800 ">
              Mis tareas
            </button>
            <button className="px-4 py-2 text-gray-600">Proyecto</button>
          </div>

          {/* Task table */}
          <div className="flex-grow overflow-auto">
            <table className="min-w-full text-black">
              <thead className="bg-oc-primary">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      onChange={handleSelectAll}
                      checked={
                        selectedTasks.length === paginatedTasks.length &&
                        paginatedTasks.length > 0
                      }
                    />
                  </th>
                  <th className="px-4 py-3 text-left">Tarea</th>
                  <th className="px-4 py-3 text-left">Título</th>
                  <th className="px-4 py-3 text-left">Tag</th>
                  <th className="px-4 py-3 text-left">Estatus</th>
                  <th className="px-4 py-3 text-left">Inicio</th>
                  <th className="px-4 py-3 text-left">Fin</th>
                  <th className="px-4 py-3 text-left">Creada por</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="border-t border-oc-outline-light/60 hover:bg-white"
                  >
                    <td className="px-4 py-3 ">
                      <input
                        type="checkbox"
                        className="w-4 h-4"
                        checked={selectedTasks.includes(task.id)}
                        onChange={() => handleTaskSelection(task.id)}
                      />
                    </td>
                    <td className="px-4 py-3">#152</td>
                    <td className="px-4 py-3">
                      <a href="#" className="hover:underline">
                        {task.title}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          task.tag === "Feature"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {task.tag}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <span>En Progreso</span>
                        <i className="fa fa-chevron-down ml-1 text-gray-500"></i>
                      </div>
                    </td>
                    <td className="px-4 py-3">{task.startDate}</td>
                    <td className="px-4 py-3">{task.endDate || "—"}</td>
                    <td className="px-4 py-3">{task.createdBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer / Pagination */}
        <div className="px-4 py-2 flex items-center justify-between text-black text-sm">
          <div>{selectedTasks.length} seleccionadas</div>
          <div className="flex items-center">
            <span className="mr-4">
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex ">
              <button
                className="w-8 h-8 flex items-center justify-center border rounded-l border-oc-outline-light"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                <i className="fa fa-angle-double-left"></i>
              </button>
              <button
                className="w-8 h-8 flex items-center justify-center border-t border-r border-b border-oc-outline-light"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <i className="fa fa-angle-left"></i>
              </button>
              <button
                className="w-8 h-8 flex items-center justify-center border-t border-b border-oc-outline-light"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
              >
                <i className="fa fa-angle-right"></i>
              </button>
              <button
                className="w-8 h-8 flex items-center justify-center border rounded-r border-oc-outline-light"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                <i className="fa fa-angle-double-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
