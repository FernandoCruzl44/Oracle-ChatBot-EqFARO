// app/components/TaskModal/TaskMetadata.tsx
import { useState, useRef, useEffect } from "react";
import { Select } from "../../Select";
import { Input } from "../../Input";
import type { Task, User } from "~/types";
import { FormField } from "../../FormField";
import { Card } from "../../Card";

interface TaskMetadataProps {
  editableTask: Task;
  teamSprints: any[];
  users: User[];
  filteredUsers: User[];
  handleInputChange: (field: keyof Task, value: any) => void;
  generateAvatarColor: (name: string) => {
    backgroundColor: string;
    color: string;
  };
}

export function TaskMetadata({
  editableTask,
  teamSprints,
  users,
  filteredUsers,
  handleInputChange,
  generateAvatarColor,
}: TaskMetadataProps) {
  const [isAssigneesOpen, setIsAssigneesOpen] = useState(false);
  const assigneesRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLButtonElement>(null);

  const toggleAssignee = (user: User) => {
    const currentAssignees = [...(editableTask.assignees || [])];

    const isAssigned = currentAssignees.some((a) => a.id === user.id);

    let newAssignees;
    if (isAssigned) {
      // Remove assignee
      newAssignees = currentAssignees.filter((a) => a.id !== user.id);
    } else {
      // Add assignee
      newAssignees = [...currentAssignees, user];
    }

    handleInputChange("assignees", newAssignees);
  };

  // Click outside handler to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isAssigneesOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        assigneesRef.current &&
        !assigneesRef.current.contains(event.target as Node)
      ) {
        setIsAssigneesOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isAssigneesOpen]);

  return (
    <>
      <div className="flex-1 space-y-4">
        <Card className="h-full">
          <FormField label="Tag" icon="tag">
            <Select
              value={editableTask.tag}
              onChange={(e) =>
                handleInputChange("tag", e.target.value as "Feature" | "Issue")
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
              value={editableTask.status}
              onChange={(e) => handleInputChange("status", e.target.value)}
              options={[
                { value: "Backlog", label: "Backlog" },
                { value: "En progreso", label: "En progreso" },
                { value: "Completada", label: "Completada" },
                { value: "Cancelada", label: "Cancelada" },
              ]}
            />
          </FormField>

          <div className="space-y-4">
            {editableTask.teamName && (
              <FormField label="Equipo" icon="users">
                <Input
                  type="text"
                  value={editableTask.teamName || ""}
                  readOnly
                  className="max-w-32"
                />
              </FormField>
            )}

            <FormField label="Sprint" icon="alarm-clock">
              <Select
                value={editableTask.sprintId?.toString() || ""}
                onChange={(e) =>
                  handleInputChange(
                    "sprintId",
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
                options={[
                  { value: "", label: "Sin sprint" },
                  ...teamSprints.map((sprint) => ({
                    value: sprint.id.toString(),
                    label: sprint.name,
                  })),
                ]}
              />
            </FormField>
          </div>

          <FormField label="Creada por" icon="user">
            <Input
              type="text"
              value={editableTask.creatorName || "—"}
              readOnly
              className="max-w-32"
            />
          </FormField>

          <FormField label="Asignados" icon="user-plus">
            <div className="relative flex">
              <div className="flex w-[180px] flex-1">
                <div className="flex flex-wrap items-center gap-1">
                  {editableTask.assignees &&
                  editableTask.assignees.length > 0 ? (
                    editableTask.assignees.map((assignee, i) => {
                      const colors = generateAvatarColor(assignee.name);
                      return (
                        <span
                          key={i}
                          style={{
                            backgroundColor: colors.backgroundColor,
                            color: colors.color,
                          }}
                          className="border-oc-outline-light/60 flex-shrink-0 rounded-full border px-1.5 py-0.5 text-xs font-bold whitespace-nowrap"
                          title={assignee.name}
                        >
                          {assignee.name}
                        </span>
                      );
                    })
                  ) : (
                    <span className="pt-0.5 text-xs text-white/60">
                      Ninguno
                    </span>
                  )}

                  <button
                    type="button"
                    ref={dropdownRef}
                    className="border-oc-outline-light/60 flex-shrink-0 rounded-full border px-1.5 py-1 text-xs font-bold whitespace-nowrap"
                    onClick={() => setIsAssigneesOpen(!isAssigneesOpen)}
                  >
                    {isAssigneesOpen ? "Cerrar" : "Editar"}
                  </button>
                </div>
              </div>

              {isAssigneesOpen && (
                <div
                  ref={assigneesRef}
                  className="border-oc-outline-light/30 bg-oc-neutral/95 absolute top-11 right-0.5 z-10 mt-2 flex max-h-60 min-h-16 w-56 flex-1 flex-col gap-3 overflow-y-auto rounded-lg border p-3 shadow-lg"
                >
                  <div className="border-oc-outline-light/50 border-b pb-2 text-sm font-medium">
                    Asignar usuarios
                  </div>
                  {filteredUsers.length === 0 ? (
                    <p className="pt-0.5 text-xs text-white/60">
                      No hay usuarios disponibles
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
                          checked={
                            editableTask.assignees?.some(
                              (a) => a.id === user.id,
                            ) || false
                          }
                          onChange={() => toggleAssignee(user)}
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
              )}
            </div>
          </FormField>
        </Card>
      </div>

      <div className="flex-1 space-y-4">
        <Card title="Fechas">
          <FormField label="Inicio" icon="calendar">
            <Input
              type="date"
              value={editableTask.startDate}
              onChange={(e) => handleInputChange("startDate", e.target.value)}
              customClass="min-w-32"
            />
          </FormField>
          <FormField label="Fin" icon="calendar">
            <Input
              type="date"
              value={editableTask.endDate || ""}
              onChange={(e) => handleInputChange("endDate", e.target.value)}
              customClass="min-w-32"
            />
          </FormField>
        </Card>

        <Card title="Horas">
          <FormField label="Estimadas" icon="hourglass">
            <Input
              type="number"
              step="1"
              min="0"
              value={editableTask.estimatedHours ?? ""}
              onChange={(e) =>
                handleInputChange(
                  "estimatedHours",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              placeholder="0"
            />
          </FormField>
          <FormField label="Reales" icon="hourglass">
            <Input
              type="number"
              step="1"
              min="0"
              value={editableTask.actualHours ?? ""}
              onChange={(e) =>
                handleInputChange(
                  "actualHours",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              placeholder="0"
            />
          </FormField>
        </Card>
      </div>
    </>
  );
}
