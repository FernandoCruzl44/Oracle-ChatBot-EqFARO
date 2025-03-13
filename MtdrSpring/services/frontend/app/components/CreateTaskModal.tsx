// app/components/CreateTaskModal.tsx
import { useState, useEffect, useRef } from "react";
import type { Task } from "~/types";
import useTaskStore from "~/store/index";
import { Toaster, toast } from "sonner";

interface CreateTaskModalProps {
  onClose: () => void;
  onSave: () => void;
}

export default function CreateTaskModal({
  onClose,
  onSave,
}: CreateTaskModalProps) {
  const { currentUser, users, teams, createTask, fetchUsers } = useTaskStore();

  const [isVisible, setIsVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState<"Feature" | "Issue">("Feature");
  const [status, setStatus] = useState<string>("Backlog");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [teamId, setTeamId] = useState<number | undefined>(currentUser?.teamId);
  const [assigneeIds, setAssigneeIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const assigneesListRef = useRef<HTMLDivElement>(null);
  const [assigneesListHeight, setAssigneesListHeight] = useState<number>(0);

  const isManager = currentUser?.role === "manager";
  const userTeam = currentUser?.teamId
    ? {
        id: currentUser.teamId,
        name: currentUser.teamName || "",
      }
    : null;

  const filteredUsers = teamId
    ? users.filter((user) => user.teamId === teamId)
    : users;

  useEffect(() => {
    setIsVisible(true);

    // Set initial date to today
    const today = new Date().toISOString().split("T")[0];
    setStartDate(today);

    // Fetch users if they haven't been loaded yet
    if (users.length === 0) {
      fetchUsers();
    }

    // Pre-select the user's team if they have one
    if (currentUser?.teamId) {
      setTeamId(currentUser.teamId);
    }
  }, [currentUser, fetchUsers, users.length]);

  useEffect(() => {
    if (assigneesListRef.current) {
      const contentHeight =
        filteredUsers.length === 0
          ? 40
          : Math.min(filteredUsers.length * 28, 128);
      setAssigneesListHeight(contentHeight);
    }
  }, [filteredUsers, assigneeIds]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmitTask(e as any);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [title, startDate, teamId]);

  const handleClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsVisible(false);
    setTimeout(onClose, 150);
  };

  const toggleAssignee = (userId: number) => {
    if (assigneeIds.includes(userId)) {
      setAssigneeIds(assigneeIds.filter((id) => id !== userId));
    } else {
      setAssigneeIds([...assigneeIds, userId]);
    }
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !startDate) {
      toast.error("El título y la fecha de inicio son obligatorios");
      return;
    }

    // For developers, if they don't have a team, show error
    if (!isManager && !userTeam?.id) {
      toast.error("No tienes un equipo asignado. Contacta a un administrador.");
      return;
    }

    // For managers, team is required
    if (isManager && !teamId) {
      toast.error("Debes seleccionar un equipo");
      return;
    }

    // Create task data
    const newTaskData = {
      title,
      tag,
      status,
      startDate,
      endDate: endDate || null,
      description,
      team_id: teamId,
      assignee_ids: assigneeIds.length > 0 ? assigneeIds : undefined,
    };

    try {
      // Use the store's createTask function to add the task
      await createTask(newTaskData);

      // Call the onSave callback from parent component
      onSave();
    } catch (error: any) {
      console.error("Error creating task:", error);
      toast.error(error.message || "Error al crear la tarea");
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black/60 flex items-center justify-center z-50 transition-opacity duration-150 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      <div
        className={`rounded-lg w-full max-w-[600px] flex p-2 bg-[#EFEDE9] transition-all duration-150 ease-in-out ${
          isVisible ? "translate-y-0" : "translate-y-3"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-oc-primary border border-oc-outline-light relative rounded-lg w-full flex overflow-hidden transition-all duration-150">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 border border-oc-outline-light w-7 h-7 rounded flex items-center justify-center hover:bg-oc-neutral text-gray-500 hover:text-gray-700"
          >
            <i className="fa fa-times text-xl"></i>
          </button>

          <div className="flex-1 p-8 pb-6 overflow-hidden">
            <div className="flex flex-col h-full">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título de la tarea"
                className="text-lg font-bold border-b border-oc-outline-light/60 pb-3 mb-4 bg-transparent focus:outline-none"
                required
                title="Este campo es obligatorio"
              />

              <form
                className="pt-3 text-sm flex flex-col h-full"
                onSubmit={handleSubmitTask}
                noValidate={false}
              >
                <div className="space-y-4 flex-1 overflow-y-auto transition-all duration-150">
                  <div className="flex items-center">
                    <div className="w-32 text-oc-brown/60">
                      <i className="fa fa-tag mr-2 translate-y-1"></i>
                      Tag
                    </div>
                    <select
                      value={tag}
                      onChange={(e) =>
                        setTag(e.target.value as "Feature" | "Issue")
                      }
                      className={`px-2 py-1 text-xs rounded-lg border border-oc-outline-light/40 ${
                        tag === "Feature"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                      required
                    >
                      <option value="Feature">Feature</option>
                      <option value="Issue">Issue</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <div className="w-32 text-oc-brown/60">
                      <i className="fa fa-info-circle mr-2 translate-y-1"></i>
                      Estatus
                    </div>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="px-2 py-1 text-xs rounded-lg border border-oc-outline-light/40"
                    >
                      <option value="Backlog">Backlog</option>
                      <option value="En progreso">En progreso</option>
                      <option value="Completada">Completada</option>
                      <option value="Cancelada">Cancelada</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <div className="w-32 text-oc-brown/60">
                      <i className="fa fa-calendar mr-2 translate-y-1"></i>
                      Fecha inicio
                    </div>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-2 py-1"
                      required
                    />
                  </div>

                  <div className="flex items-center">
                    <div className="w-32 text-oc-brown/60">
                      <i className="fa fa-calendar mr-2 translate-y-1"></i>
                      Fecha fin
                    </div>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-2 py-1"
                    />
                  </div>

                  <div className="flex items-center">
                    <div className="w-32 text-oc-brown/60">
                      <i className="fa fa-user mr-2 translate-y-1"></i>
                      Creada por
                    </div>
                    <input
                      type="text"
                      value={currentUser?.name || "—"}
                      readOnly
                      className="px-2 py-1"
                    />
                  </div>

                  {/* Team selector for managers */}
                  {isManager && (
                    <div className="flex items-center">
                      <div className="w-32 text-oc-brown/60">
                        <i className="fa fa-users mr-2 translate-y-1"></i>
                        Equipo
                      </div>
                      <select
                        value={teamId || ""}
                        onChange={(e) =>
                          setTeamId(Number(e.target.value) || undefined)
                        }
                        className="px-2 py-1 text-xs rounded-lg border border-oc-outline-light/40"
                        required
                        title="Debes seleccionar un equipo"
                      >
                        <option value="">Selecciona un equipo</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Show team info for non-managers */}
                  {!isManager && (
                    <div className="flex items-center">
                      <div className="w-32 text-oc-brown/60">
                        <i className="fa fa-users mr-2 translate-y-1"></i>
                        Equipo
                      </div>
                      {userTeam ? (
                        <input
                          type="text"
                          value={userTeam.name || ""}
                          readOnly
                          className="px-2 py-1"
                        />
                      ) : (
                        <span className="text-xs bg-yellow-50 border border-yellow-100 text-yellow-800 rounded-lg p-1">
                          <i className="fa fa-warning mr-1"></i>
                          No perteneces a ningún equipo
                        </span>
                      )}
                    </div>
                  )}

                  {/* Assignees */}
                  <div className="flex items-start">
                    <div className="w-32 text-oc-brown/60 pt-1">
                      <i className="fa fa-user-plus mr-2 translate-y-1"></i>
                      Asignados
                    </div>
                    <div className="flex-1">
                      <div
                        ref={assigneesListRef}
                        style={{ height: `${assigneesListHeight}px` }}
                        className="bg-white p-2 min-h-[70px] overflow-y-auto rounded-lg border transition-all duration-150 ease-in-out border-oc-outline-light/60 flex flex-col items-start"
                      >
                        {filteredUsers.length === 0 ? (
                          <p className="text-sm text-oc-brown/50">
                            No hay usuarios disponibles en este equipo
                          </p>
                        ) : (
                          filteredUsers.map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center p-1 transition-all duration-150"
                            >
                              <input
                                type="checkbox"
                                id={`user-${user.id}`}
                                checked={assigneeIds.includes(user.id)}
                                onChange={() => toggleAssignee(user.id)}
                                className="mr-2"
                              />
                              <label
                                htmlFor={`user-${user.id}`}
                                className="text-sm"
                              >
                                {user.name}{" "}
                                <span className="text-xs text-oc-brown/50">
                                  ({user.role})
                                </span>
                              </label>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descripción (Opcional)"
                    className="w-full border bg-white rounded-lg p-3 min-h-[120px] text-sm text-oc-brown border-oc-outline-light/60"
                  ></textarea>
                </div>

                <div className="my-2">
                  <button
                    type="submit"
                    className="w-full text-sm py-2.5 bg-oc-brown text-white rounded hover:bg-oc-brown/90 transition-all flex justify-center items-center"
                  >
                    <span>Crear Tarea</span>
                    <span className="ml-2 text-xs flex items-center text-oc-outline-light/80">
                      <i className="fa fa-keyboard mr-1" aria-hidden="true"></i>
                      ⌘ + Enter / Ctrl + Enter
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
