// app/components/TaskModal/TaskMetadata.tsx
import { Select } from "../../Select";
import { Input } from "../../Input";
import type { Task } from "~/types";
import { FormField } from "../../FormField";
import { Card } from "../../Card";

interface TaskMetadataProps {
  editableTask: Task;
  teamSprints: any[];
  handleInputChange: (field: keyof Task, value: any) => void;
  generateAvatarColor: (name: string) => {
    backgroundColor: string;
    color: string;
  };
}

export function TaskMetadata({
  editableTask,
  teamSprints,
  handleInputChange,
  generateAvatarColor,
}: TaskMetadataProps) {
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
                value={editableTask.sprintId || ""}
                onChange={(e) =>
                  handleInputChange(
                    "sprintId",
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
                options={[
                  { value: "", label: "Sin sprint" },
                  ...teamSprints.map((sprint) => ({
                    value: sprint.id,
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

          <FormField
            label="Asignados"
            icon="user-plus"
            className="flex items-start pt-1"
          >
            <div className="flex flex-wrap gap-1">
              {editableTask.assignees && editableTask.assignees.length > 0 ? (
                editableTask.assignees.map((assignee, i) => {
                  const colors = generateAvatarColor(assignee.name);
                  return (
                    <span
                      key={i}
                      style={{
                        backgroundColor: colors.backgroundColor,
                        color: colors.color,
                      }}
                      className="border-oc-outline-light/60 rounded-full border px-1.5 py-0.5 text-xs font-bold whitespace-nowrap"
                      title={assignee.name}
                    >
                      {assignee.name}
                    </span>
                  );
                })
              ) : (
                <span className="pt-0.5 text-xs text-white/60">Ninguno</span>
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
