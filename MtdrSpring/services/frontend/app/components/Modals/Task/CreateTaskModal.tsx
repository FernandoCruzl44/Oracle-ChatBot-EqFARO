// app/components/CreateTaskModal.tsx
import { useState, useEffect, useRef } from "react";
import type { Task } from "~/types";
import useTaskStore from "~/store/index";
import { Toaster, toast } from "sonner";
import { Modal } from "../../Modal";
import { Card } from "../../Card";
import { FormField } from "../../FormField";
import { Input } from "../../Input";
import { Select } from "../../Select";
import { Button } from "../../Button";

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

    if (currentUser?.teamId && !teamId) {
      setTeamId(currentUser.teamId);
    }
  }, [currentUser, fetchUsers, users.length, teamId]);

  useEffect(() => {
    if (teamId) {
      const currentTeamSprints = getSprintsByTeam(teamId);
      if (currentTeamSprints && currentTeamSprints.length > 0) {
        const sortedSprints = [...currentTeamSprints].sort((a, b) => {
          const aEndDate = a.endDate ? new Date(a.endDate).getTime() : 0;
          const bEndDate = b.endDate ? new Date(b.endDate).getTime() : 0;

          if (aEndDate !== bEndDate) {
            return bEndDate - aEndDate;
          }

          const aStartDate = a.startDate ? new Date(a.startDate).getTime() : 0;
          const bStartDate = b.startDate ? new Date(b.startDate).getTime() : 0;
          return bStartDate - aStartDate;
        });

        setSprintId(sortedSprints[0].id);
        const startDate = sortedSprints[0].startDate;
        const endDate = sortedSprints[0].endDate;
        if (startDate) {
          setStartDate(startDate);
        }
        if (endDate) {
          setEndDate(endDate);
        }
      } else {
        setSprintId(null);
      }
    } else {
      setSprintId(null);
    }
  }, [teamId, getSprintsByTeam, sprints]);

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
    <Modal
      isVisible={isVisible}
      onClose={handleClose}
      handleClose={handleClose}
    >
      <div className="flex-1 overflow-hidden p-8">
        <div className="flex h-full flex-col">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título de la tarea"
            className="border-oc-outline-light/60 mb-4 border-b bg-transparent pb-3 text-lg font-bold text-white focus:outline-none"
            required
            title="Este campo es obligatorio"
          />

          <form
            className="flex flex-col pt-3 text-sm"
            onSubmit={handleSubmitTask}
          >
            {/* Layout with two columns like in TaskModal */}
            <div className="flex flex-1 flex-row gap-4">
              {/* Left column */}
              <div className="h-full flex-1 space-y-4">
                <Card>
                  <FormField label="Tag" icon="tag">
                    <Select
                      value={tag}
                      onChange={(e) =>
                        setTag(e.target.value as "Feature" | "Issue")
                      }
                      styleByValue={{
                        getClassName: (value) =>
                          value === "Feature"
                            ? "text-green-300 outline-green-300/20"
                            : "text-red-300 outline-red-300/20",
                      }}
                      options={[
                        { value: "Feature", label: "Feature" },
                        { value: "Issue", label: "Issue" },
                      ]}
                    />
                  </FormField>

                  <FormField label="Estatus" icon="info-circle">
                    <Select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      options={[
                        { value: "Backlog", label: "Backlog" },
                        { value: "En progreso", label: "En progreso" },
                        { value: "Completada", label: "Completada" },
                        { value: "Cancelada", label: "Cancelada" },
                      ]}
                    />
                  </FormField>

                  <div className="space-y-4">
                    {isManager ? (
                      <FormField label="Equipo" icon="users">
                        <Select
                          value={teamId?.toString() || ""}
                          onChange={(e) =>
                            setTeamId(Number(e.target.value) || undefined)
                          }
                          options={[
                            { value: "", label: "Elige un equipo" },
                            ...teams.map((team) => ({
                              value: team.id.toString(),
                              label: team.name,
                            })),
                          ]}
                        />
                      </FormField>
                    ) : (
                      <FormField label="Equipo" icon="users">
                        {userTeam ? (
                          <Input
                            type="text"
                            value={userTeam.name || ""}
                            readOnly
                            className="max-w-32"
                          />
                        ) : (
                          <span className="rounded-lg border border-yellow-100 bg-yellow-50 p-1 text-xs text-yellow-800">
                            <i className="fa fa-warning mr-1"></i>
                            No perteneces a ningún equipo
                          </span>
                        )}
                      </FormField>
                    )}

                    <FormField label="Sprint" icon="alarm-clock">
                      <Select
                        value={sprintId?.toString() || ""}
                        onChange={(e) =>
                          setSprintId(
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                          )
                        }
                        options={[
                          { value: "", label: "Sin sprint" },
                          ...teamSprints.map((sprint) => ({
                            value: sprint.id.toString(),
                            label: sprint.name,
                          })),
                        ]}
                        disabled={!teamId}
                      />
                    </FormField>
                  </div>
                </Card>

                <Card>
                  <FormField label="Inicio" icon="calendar">
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      customClass="min-w-32"
                      required
                    />
                  </FormField>
                  <FormField label="Fin" icon="calendar">
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      customClass="min-w-32"
                    />
                  </FormField>
                  <FormField label="H. Estimadas" icon="hourglass">
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      value={estimatedHours ?? ""}
                      onChange={(e) =>
                        setEstimatedHours(
                          e.target.value === "" ? null : Number(e.target.value),
                        )
                      }
                      placeholder="0"
                    />
                  </FormField>
                </Card>
              </div>

              {/* Right column */}
              <Card className="flex-1">
                <div className="flex flex-col gap-3 p-1.5">
                  <div className="text-oc-brown/60 w-32">
                    <i className="fa fa-user-plus mr-2 translate-y-1"></i>
                    Asignados
                  </div>
                  <div
                    ref={assigneesListRef}
                    className="flex min-h-16 min-w-40 flex-1 flex-col gap-3 overflow-y-auto pt-1.5"
                  >
                    {teamId === null ? (
                      <p className="pt-0.5 text-xs text-white/60">
                        Elige un equipo
                      </p>
                    ) : filteredUsers.length === 0 ? (
                      <p className="pt-0.5 text-xs text-white/60">
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
                            className="mt-0 mr-2 pt-0"
                          />
                          <label
                            htmlFor={`user-${user.id}`}
                            className="text-sm text-white"
                          >
                            {user.name}
                            <span className="text-oc-brown/50 ml-2 text-xs">
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
              </Card>
            </div>

            <div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción (Opcional)"
                className="bg-oc-neutral/30 text-oc-brown border-oc-outline-light/60 my-4 min-h-[120px] w-full resize-none overflow-auto rounded-lg border p-3 text-sm"
              ></textarea>
            </div>

            <Button
              type="submit"
              isEditing={title === "" ? false : true && assigneeIds.length > 0}
              disabled={!title || !teamId || assigneeIds.length === 0}
            >
              <span>Crear Tarea</span>
              <span className="ml-2 flex items-center text-xs opacity-40">
                <i className="fa fa-keyboard mr-1" aria-hidden="true"></i>⌘ +
                Enter / Ctrl + Enter
              </span>
            </Button>
          </form>
        </div>
      </div>
    </Modal>
  );
}
