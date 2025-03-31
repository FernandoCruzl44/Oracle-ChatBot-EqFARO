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
  const {
    currentUser,
    users,
    teams,
    createTask,
    fetchUsers,
    sprints,
    getSprintsByTeam,
  } = useTaskStore();

  const [isVisible, setIsVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState<"Feature" | "Issue">("Feature");
  const [status, setStatus] = useState<string>("Backlog");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [teamId, setTeamId] = useState<number | undefined>(currentUser?.teamId);
  const [sprintId, setSprintId] = useState<number | null>(null);
  const [assigneeIds, setAssigneeIds] = useState<number[]>([]);
  const [estimatedHours, setEstimatedHours] = useState<number | null>(null);

  const assigneesListRef = useRef<HTMLDivElement>(null);

  const isManager = currentUser?.role === "manager";
  const userTeam = currentUser?.teamId
    ? {
        id: currentUser.teamId,
        name: currentUser.teamName || "",
      }
    : null;

  const filteredUsers = teamId
    ? users.filter((user) => user.teamId === teamId)
    : [];

  const teamSprints = teamId ? getSprintsByTeam(teamId) : [];

  useEffect(() => {
    setIsVisible(true);

    const today = new Date().toISOString().split("T")[0];
    setStartDate(today);

    if (users.length === 0) {
      fetchUsers();
    }

    if (currentUser?.teamId) {
      setTeamId(currentUser.teamId);
    }
  }, [currentUser, fetchUsers, users.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const syntheticEvent = {
          preventDefault: () => {},
        };
        handleSubmitTask(syntheticEvent as React.FormEvent);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    title,
    startDate,
    teamId,
    sprintId,
    description,
    tag,
    status,
    endDate,
    assigneeIds,
    estimatedHours,
  ]);

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

    if (!isManager && !userTeam?.id) {
      toast.error("No tienes un equipo asignado. Contacta a un administrador.");
      return;
    }

    if (isManager && !teamId) {
      toast.error("Debes seleccionar un equipo");
      return;
    }

    let parsedEstimatedHours = null;
    if (estimatedHours !== null) {
      parsedEstimatedHours = Number(estimatedHours);
      if (isNaN(parsedEstimatedHours)) {
        toast.error("Las horas estimadas deben ser un número válido");
        return;
      }
    }

    const newTaskData = {
      title,
      tag,
      status,
      startDate,
      endDate: endDate || null,
      description,
      team_id: teamId,
      sprint_id: sprintId,
      assignee_ids: assigneeIds.length > 0 ? assigneeIds : undefined,
      estimated_hours: parsedEstimatedHours,
    };

    try {
      await createTask(newTaskData);
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
        className={`rounded-lg flex min-w-xl p-2 bg-oc-neutral transition-transform duration-150 ${
          isVisible ? "translate-y-0" : "translate-y-3"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-oc-primary border border-oc-outline-light relative rounded-lg w-full flex overflow-hidden">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 border border-oc-outline-light w-7 h-7 rounded flex items-center justify-center hover:bg-oc-neutral text-stone-500 hover:text-stone-700"
          >
            <i className="fa fa-times text-xl"></i>
          </button>

          <div className="flex-1 p-8 overflow-hidden">
            <div className="flex flex-col h-full">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título de la tarea"
                className="text-lg text-white font-bold border-b border-oc-outline-light/60 pb-3 mb-4 bg-transparent focus:outline-none"
                required
                title="Este campo es obligatorio"
              />

              <form
                className="pt-3 text-sm flex flex-col"
                onSubmit={handleSubmitTask}
              >
                {/* Layout with two columns like in TaskModal */}
                <div className="flex flex-row gap-4 flex-1">
                  {/* Left column */}
                  <div className="space-y-4 flex-1 h-full">
                    <div className="space-y-4 p-4 rounded-xl bg-oc-neutral/30  border border-oc-outline-light/60">
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
                          className="px-2 py-2 my-[1px] text-xs text-white rounded-lg outline outline-oc-outline-light/40 bg-oc-neutral/50 min-w-32 border-r-5 border-transparent"
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
                          className="px-2 py-2 my-[1px] text-xs text-white rounded-lg outline outline-oc-outline-light/40 bg-oc-neutral/50 min-w-32 border-r-5 border-transparent"
                        >
                          <option value="Backlog">Backlog</option>
                          <option value="En progreso">En progreso</option>
                          <option value="Completada">Completada</option>
                          <option value="Cancelada">Cancelada</option>
                        </select>
                      </div>

                      <div className="space-y-4">
                        {isManager ? (
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
                              className="px-2 py-2 my-[1px] text-xs text-white rounded-lg outline outline-oc-outline-light/40 bg-oc-neutral/50 min-w-32 border-r-5 border-transparent"
                              required
                            >
                              <option value="">Elige un equipo</option>
                              {teams.map((team) => (
                                <option key={team.id} value={team.id}>
                                  {team.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
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
                                className="px-2 py-2 text-xs text-white rounded-lg border border-oc-outline-light/40 bg-oc-neutral/50 max-w-32"
                              />
                            ) : (
                              <span className="text-xs bg-yellow-50 border border-yellow-100 text-yellow-800 rounded-lg p-1">
                                <i className="fa fa-warning mr-1"></i>
                                No perteneces a ningún equipo
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center">
                          <div className="w-32 text-oc-brown/60">
                            <i className="fa fa-alarm-clock mr-2 translate-y-1"></i>
                            Sprint
                          </div>
                          <select
                            value={sprintId || ""}
                            onChange={(e) =>
                              setSprintId(
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value)
                              )
                            }
                            className="px-2 py-2 my-[1px] text-xs text-white rounded-lg outline outline-oc-outline-light/40 bg-oc-neutral/50 min-w-32 border-r-5 border-transparent"
                          >
                            <option value="">Sin sprint</option>
                            {teamSprints.map((sprint) => (
                              <option key={sprint.id} value={sprint.id}>
                                {sprint.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 p-4 rounded-xl bg-oc-neutral/30 border border-oc-outline-light/60">
                      <div className="flex items-center">
                        <div className="w-32 text-oc-brown/60">
                          <i className="fa fa-calendar mr-2 translate-y-1"></i>
                          Inicio
                        </div>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="px-2 py-2 text-xs text-white rounded-lg border border-oc-outline-light/40 bg-oc-neutral/50 min-w-32"
                          required
                        />
                      </div>
                      <div className="flex items-center">
                        <div className="w-32 text-oc-brown/60">
                          <i className="fa fa-calendar mr-2 translate-y-1"></i>
                          Fin
                        </div>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="px-2 py-2 text-xs text-white rounded-lg border border-oc-outline-light/40 bg-oc-neutral/50 min-w-32"
                        />
                      </div>
                      <div className="flex items-center">
                        <div className="w-32 text-oc-brown/60">
                          <i className="fa fa-hourglass mr-2 translate-y-1"></i>
                          H. Estimadas
                        </div>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={estimatedHours ?? ""}
                          onChange={(e) =>
                            setEstimatedHours(
                              e.target.value === ""
                                ? null
                                : Number(e.target.value)
                            )
                          }
                          className="px-2 py-2 text-white text-xs rounded-lg border border-oc-outline-light/40 bg-oc-neutral/50 w-32"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right column */}
                  <div className="space-y-4 p-4 rounded-xl bg-oc-neutral/30 border border-oc-outline-light/60">
                    <div className="p-1.5 flex flex-col gap-3">
                      <div className="w-32 text-oc-brown/60 ">
                        <i className="fa fa-user-plus mr-2 translate-y-1"></i>
                        Asignados
                      </div>
                      <div
                        ref={assigneesListRef}
                        className="flex flex-col gap-3 flex-1 overflow-y-auto min-h-16 min-w-40 pt-1.5"
                      >
                        {teamId === null ? (
                          <p className="text-xs text-white/60  pt-0.5">
                            Elige un equipo
                          </p>
                        ) : filteredUsers.length === 0 ? (
                          <p className="text-xs text-white/60 pt-0.5">
                            Elige un equipo
                          </p>
                        ) : (
                          filteredUsers.map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center transition-all duration-150"
                            >
                              <input
                                type="checkbox"
                                id={`user-${user.id}`}
                                checked={assigneeIds.includes(user.id)}
                                onChange={() => toggleAssignee(user.id)}
                                className="mr-2 mt-0 pt-0"
                              />
                              <label
                                htmlFor={`user-${user.id}`}
                                className="text-sm text-white "
                              >
                                {user.name}
                                <span className="text-xs text-oc-brown/50 ml-2">
                                  (
                                  {user.role
                                    ? user.role.charAt(0).toUpperCase() +
                                      user.role.slice(1)
                                    : ""}
                                  )
                                </span>
                              </label>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Right column End */}
                </div>

                <div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descripción (Opcional)"
                    className="w-full border my-4 bg-oc-neutral/30 rounded-lg p-3 min-h-[120px] text-sm text-oc-brown border-oc-outline-light/60"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="mt-auto w-full text-sm py-2.5 bg-oc-neutral/50 border border-oc-outline-light/60 rounded-lg hover:bg-black transition-all flex justify-center items-center text-white"
                >
                  <span>Crear Tarea</span>
                  <span className="ml-2 text-xs flex items-center opacity-40">
                    <i className="fa fa-keyboard mr-1" aria-hidden="true"></i>⌘
                    + Enter / Ctrl + Enter
                  </span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
