import { useState, useEffect, useRef } from "react";
import type { Task } from "~/types"; // Assuming User type is also in types if needed later
import { Modal } from "~/components/Modal";
import { generateAvatarColor, formatDate } from "~/lib/utils";
import { FormField } from "~/components/FormField";
import { Input } from "~/components/Input"; // Use your existing Input
import { Select } from "~/components/Select"; // Import the custom Select
import { Button } from "~/components/Button";
import useTaskState from "~/store";

interface EditableTaskModalProps {
  task: Task;
  onClose: () => void;
  onUpdate?: (updatedTask: Task) => void;
  onRemove?: () => void;
  isEditable?: boolean;
  // Add teamSprints if Sprint selection becomes editable
  // teamSprints?: any[];
}

// Define base styles inspired by Select.tsx for consistency
const baseInteractiveStyle =
  "my-[1px] min-w-32 rounded-lg border-r-5 border-transparent px-2 py-2 text-xs outline outline-oc-outline-light/40 bg-oc-neutral/50 text-white focus:outline-blue-500 focus:ring-0";
const numberInputStyle = `${baseInteractiveStyle} w-24`; // Specific width for numbers
const dateInputStyle = `${baseInteractiveStyle}`;
const textareaStyle =
  "min-h-[120px] w-full resize-none overflow-auto rounded-lg p-3 text-sm outline outline-oc-outline-light/40 bg-oc-neutral/50 text-white focus:outline-blue-500 focus:ring-0"; // Keep text-sm for textarea

export function EditableTaskModal({
  task,
  onClose,
  onUpdate,
  onRemove,
  isEditable = true,
}: // teamSprints // Destructure if Sprint becomes editable
EditableTaskModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [formData, setFormData] = useState<Task>({ ...task });
  const [isDirty, setIsDirty] = useState(false);
  const modalContentRef = useRef<HTMLDivElement>(null);

  const { getSprintById } = useTaskState();

  const sprint = task.sprintId ? getSprintById(task.sprintId) : null;

  useEffect(() => {
    setFormData({ ...task });
    setIsDirty(false);
  }, [task]);

  useEffect(() => {
    setTimeout(() => {
      setIsVisible(true);
    }, 0);
  }, []);

  const handleClose = (e?: React.MouseEvent | MouseEvent) => {
    if (e && typeof e.stopPropagation === "function") {
      e.stopPropagation();
    }
    setIsVisible(false);
    setTimeout(onClose, 150);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      isVisible &&
      modalContentRef.current &&
      !modalContentRef.current.contains(event.target as Node)
    ) {
      handleClose(event);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      } else if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        if (isDirty && isEditable) {
          event.preventDefault();
          handleSave();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    if (isVisible) {
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isVisible, isDirty, isEditable, formData]);

  const displayValue = (value: string | number | null | undefined) => {
    return value !== null && value !== undefined && value !== "" ? value : "—";
  };

  const handleInputChange = (field: keyof Task, value: any) => {
    if (
      (field === "estimatedHours" || field === "actualHours") &&
      value === ""
    ) {
      value = null;
    }
    if (
      (field === "estimatedHours" || field === "actualHours") &&
      value !== null
    ) {
      value = parseInt(value, 10);
      if (isNaN(value)) {
        value = null;
      }
    }
    // Handle date input potentially returning empty string
    if ((field === "startDate" || field === "endDate") && value === "") {
      // Decide if empty date means null or keep empty string based on Task type
      // Assuming null is preferred for optional dates
      value = field === "endDate" ? null : value; // Keep startDate potentially required?
    }

    // Check against original task prop to set dirty state
    let formIsStillDirty = false;
    const updatedFormData = { ...formData, [field]: value };
    for (const key in updatedFormData) {
      if (
        Object.prototype.hasOwnProperty.call(updatedFormData, key) &&
        JSON.stringify(updatedFormData[key as keyof Task]) !==
          JSON.stringify(task[key as keyof Task])
      ) {
        formIsStillDirty = true;
        break;
      }
    }
    setIsDirty(formIsStillDirty);

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    if (onUpdate && isEditable && isDirty) {
      const taskForUpdate = {
        ...formData,
        // Adjust keys if API expects snake_case, e.g.:
        // estimated_hours: formData.estimatedHours,
        // actual_hours: formData.actualHours,
        // assignee_ids: formData.assignees?.map(a => a.id), // If assignees become editable
      };
      onUpdate(taskForUpdate);
      setIsDirty(false);
      // handleClose(); // Optionally close on save
    }
  };

  const handleRemove = () => {
    if (onRemove && isEditable) {
      setIsVisible(false);
      setTimeout(() => {
        onRemove();
      }, 150);
    }
  };

  const handleCancel = () => {
    setFormData({ ...task });
    setIsDirty(false);
    handleClose();
  };

  const formatDateForInput = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const offset = date.getTimezoneOffset();
      const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
      return adjustedDate.toISOString().split("T")[0];
    } catch (e) {
      return "";
    }
  };

  return (
    <Modal
      className="bg-oc-dark-gray-accent z-[60] max-h-[90vh] w-[750px] overflow-hidden"
      isVisible={isVisible}
      onClose={handleClose}
      handleClose={handleClose}
      overlayClassName="bg-black/40 backdrop-blur-xs"
      isOverlayInteractive={false}
    >
      <div ref={modalContentRef} className="flex h-full w-full flex-col">
        <div className="flex-1 overflow-y-auto p-8">
          {/* Header */}
          <div className="border-oc-outline-light/60 mb-4 border-b pb-3">
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Título de la tarea"
              className="w-full bg-transparent text-lg font-bold text-white focus:outline-none"
              readOnly={!isEditable}
            />
          </div>

          {/* Form Area */}
          <form
            className="flex flex-1 flex-col pt-3 text-sm"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <div className="flex flex-1 gap-6">
              {/* Left Column */}
              <div className="flex-1 space-y-4">
                <FormField label="Tag" icon="tag">
                  <Select
                    value={formData.tag}
                    onChange={(e) =>
                      handleInputChange(
                        "tag",
                        e.target.value as "Feature" | "Issue",
                      )
                    }
                    disabled={!isEditable}
                    options={[
                      { value: "Feature", label: "Feature" },
                      { value: "Issue", label: "Issue" },
                    ]}
                    styleByValue={{
                      getClassName: (value) =>
                        value === "Feature"
                          ? "text-green-300 outline-green-300/20" // Match TaskMetadata style
                          : "text-red-300 outline-red-300/20",
                    }}
                    // Use default className from Select component
                  />
                </FormField>

                <FormField label="Estatus" icon="info-circle">
                  <Select
                    value={formData.status}
                    onChange={(e) =>
                      handleInputChange("status", e.target.value)
                    }
                    disabled={!isEditable}
                    options={[
                      { value: "Backlog", label: "Backlog" },
                      { value: "To Do", label: "To Do" },
                      { value: "En Progreso", label: "En Progreso" },
                      { value: "Completado", label: "Completado" },
                    ]}
                    // Uses default styling from Select component
                  />
                </FormField>

                {task.teamName && (
                  <FormField label="Equipo" icon="users">
                    {/* Display only, not editable */}
                    <span className="text-sm text-white">
                      {displayValue(task.teamName)}
                    </span>
                  </FormField>
                )}

                <FormField label="Sprint" icon="alarm-clock">
                  {/* Display only, not editable */}
                  <span className="text-sm text-white">
                    {displayValue(sprint?.name) || "Sin sprint"}
                  </span>
                  {/* If Sprint needs to be editable, replace span with Select and pass teamSprints prop */}
                  {/* <Select
                                        value={formData.sprintId?.toString() || ""}
                                        onChange={(e) => handleInputChange('sprintId', e.target.value === "" ? null : Number(e.target.value))}
                                        disabled={!isEditable}
                                        options={[
                                            { value: "", label: "Sin sprint" },
                                            ...(teamSprints?.map((sprint) => ({
                                                value: sprint.id.toString(),
                                                label: sprint.name,
                                            })) || [])
                                        ]}
                                        className={baseInteractiveStyle} // Apply base style
                                    /> */}
                </FormField>

                <FormField label="Creada por" icon="user">
                  {/* Display only */}
                  <span className="text-sm text-white">
                    {displayValue(task.creatorName)}
                  </span>
                </FormField>

                <FormField label="Asignados" icon="user-plus">
                  {/* Display only - using avatar style */}
                  <div className="flex flex-wrap items-center gap-1">
                    {formData.assignees && formData.assignees.length > 0 ? (
                      formData.assignees.map((assignee, i) => {
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
                    {/* Add edit button here if assignee editing is implemented later */}
                  </div>
                </FormField>
              </div>

              {/* Right Column */}
              <div className="flex-1 space-y-4">
                <FormField label="Inicio" icon="calendar">
                  <Input
                    type="date"
                    value={formatDateForInput(formData.startDate)}
                    onChange={(e) =>
                      handleInputChange("startDate", e.target.value)
                    }
                    className={dateInputStyle} // Apply consistent style
                    readOnly={!isEditable}
                  />
                </FormField>

                <FormField label="Fin" icon="calendar">
                  <Input
                    type="date"
                    value={formatDateForInput(formData.endDate)}
                    onChange={(e) =>
                      handleInputChange("endDate", e.target.value)
                    } // handleInputChange handles empty string -> null
                    className={dateInputStyle}
                    readOnly={!isEditable}
                  />
                </FormField>

                <FormField label="Horas Estimadas" icon="hourglass-half">
                  <Input
                    type="number"
                    value={formData.estimatedHours ?? ""}
                    onChange={(e) =>
                      handleInputChange("estimatedHours", e.target.value)
                    }
                    className={numberInputStyle} // Apply consistent style
                    placeholder="0"
                    min="0"
                    step="1" // Or adjust step as needed
                    readOnly={!isEditable}
                  />
                </FormField>

                <FormField label="Horas Reales" icon="check-circle">
                  <Input
                    type="number"
                    value={formData.actualHours ?? ""}
                    onChange={(e) =>
                      handleInputChange("actualHours", e.target.value)
                    }
                    className={numberInputStyle}
                    placeholder="0"
                    min="0"
                    step="1"
                    readOnly={!isEditable}
                  />
                </FormField>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <label className="text-oc-text-gray mb-2 block text-sm font-medium">
                Descripción
              </label>
              <textarea
                value={formData.description || ""}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                className={textareaStyle} // Apply consistent style
                placeholder="Añade una descripción..."
                readOnly={!isEditable}
              />
            </div>
          </form>
        </div>

        {/* Footer for Buttons */}
        {isEditable && (
          <div className="border-oc-outline-light/60 flex items-center justify-end gap-3 border-t p-4">
            <Button
              onClick={handleRemove}
              className="bg-red-600 px-4 py-1.5 text-sm hover:bg-red-700"
              aria-label="Eliminar tarea"
            >
              <i className="fa fa-trash mr-1.5"></i>
              Eliminar
            </Button>
            <Button
              onClick={handleCancel}
              className="bg-oc-neutral hover:bg-oc-neutral-light px-4 py-1.5 text-sm"
              aria-label="Cancelar cambios"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!isDirty}
              className={`px-4 py-1.5 text-sm ${
                isDirty
                  ? "bg-green-600 hover:bg-green-700"
                  : "cursor-not-allowed bg-green-800/50 text-white/50"
              }`}
              aria-label="Guardar cambios"
            >
              <span>Guardar Cambios</span>
              <span className="ml-2 hidden items-center text-xs opacity-60 md:inline-flex">
                <i className="fa fa-keyboard mr-1" aria-hidden="true"></i>⌘ +
                Enter
              </span>
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
