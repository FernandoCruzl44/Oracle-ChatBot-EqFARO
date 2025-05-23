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
  const [editingAssignees, setEditingAssignees] = useState(false);

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

  // Function to sort users - assigned users first (in original order), then unassigned
  const getOrderedUsers = () => {
    if (!editableTask.assignees || editableTask.assignees.length === 0) {
      return filteredUsers;
    }

    // Create a map of assignee IDs for quick lookup
    const assigneeIds = new Set(editableTask.assignees.map((a) => a.id));

    // Get all non-assigned users
    const unassignedUsers = filteredUsers.filter(
      (user) => !assigneeIds.has(user.id),
    );

    // Return assigned (in original order) + unassigned
    return [...editableTask.assignees, ...unassignedUsers];
  };

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
                <div className="flex min-h-[28px] flex-wrap items-center gap-1">
                  {editingAssignees ? (
                    // Show all users in edit mode
                    <>
                      {filteredUsers.length === 0 ? (
                        <span className="pt-0.5 text-xs text-white/60">
                          No hay usuarios disponibles
                        </span>
                      ) : (
                        getOrderedUsers().map((user) => {
                          const isAssigned = editableTask.assignees?.some(
                            (a) => a.id === user.id,
                          );
                          // Use user colors for assigned, gray for unassigned
                          const colors = isAssigned
                            ? generateAvatarColor(user.name)
                            : {
                                backgroundColor: "rgba(255,255,255,0.1)",
                                color: "rgba(255,255,255,0.5)",
                              };

                          return (
                            <span
                              key={user.id}
                              onClick={() => toggleAssignee(user)}
                              style={{
                                backgroundColor: colors.backgroundColor,
                                color: colors.color,
                              }}
                              className="border-oc-outline-light/60 flex-shrink-0 cursor-pointer rounded-full border px-1.5 py-0.5 text-xs font-bold whitespace-nowrap transition-all duration-150 hover:opacity-80"
                              title={`${user.name} (${isAssigned ? "Quitar" : "Asignar"})`}
                            >
                              {user.name}
                            </span>
                          );
                        })
                      )}
                    </>
                  ) : (
                    // Show only assigned users in normal mode
                    <>
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
                    </>
                  )}

                  <button
                    type="button"
                    className="border-oc-outline-light/60 flex h-6 w-6 items-center justify-center rounded-full border"
                    onClick={() => setEditingAssignees(!editingAssignees)}
                  >
                    <span
                      className={`fa fa-plus scale-80 transition-transform duration-200 ${editingAssignees ? "rotate-45" : ""}`}
                    />
                  </button>
                </div>
              </div>
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
