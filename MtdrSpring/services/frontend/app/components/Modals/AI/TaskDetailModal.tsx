import { useState, useEffect, useRef } from "react";
import type { Task } from "~/types";
import { Modal } from "~/components/Modal";
import { generateAvatarColor } from "~/lib/utils";
import { formatDate } from "~/lib/utils";
import { FormField } from "~/components/FormField";

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
}

export function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const modalContentRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isVisible &&
        modalContentRef.current &&
        !modalContentRef.current.contains(event.target as Node)
      ) {
        handleClose(event);
      }
    };

    if (isVisible) {
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isVisible, onClose]);

  const displayValue = (value: string | number | null | undefined) => {
    return value !== null && value !== undefined && value !== "" ? value : "—";
  };

  return (
    <Modal
      className="bg-oc-dark-gray-accent z-[60] h-[550px] max-h-[690px] w-[750px]"
      isVisible={isVisible}
      onClose={handleClose}
      handleClose={handleClose}
      overlayClassName="bg-black/40 backdrop-blur-xs"
      isOverlayInteractive={false}
    >
      <div ref={modalContentRef} className="flex h-full w-full">
        <div className="border-oc-outline-light/90 flex-1 overflow-y-auto p-8">
          <div className="flex h-full flex-col">
            <div className="border-oc-outline-light/60 mb-4 border-b pb-3 text-lg font-bold text-white">
              {task.title}
            </div>

            <div className="flex flex-1 gap-6 pt-3 text-sm">
              <div className="flex-1 space-y-4">
                <FormField label="Tag" icon="tag">
                  <span
                    className={`rounded-md border px-2 py-0.5 text-xs font-medium ${
                      task.tag === "Feature"
                        ? "border-green-700/50 text-green-300"
                        : "border-red-700/50 text-red-300"
                    } inline-block`}
                  >
                    {task.tag}
                  </span>
                </FormField>

                <FormField label="Estatus" icon="info-circle">
                  <span className="text-sm text-white">
                    {displayValue(task.status)}
                  </span>
                </FormField>

                {task.teamName && (
                  <FormField label="Equipo" icon="users">
                    <span className="text-sm text-white">
                      {displayValue(task.teamName)}
                    </span>
                  </FormField>
                )}

                <FormField label="Sprint" icon="alarm-clock">
                  <span className="text-sm text-white">
                    {displayValue(task.sprintId) || "Sin sprint"}
                  </span>
                </FormField>

                <FormField label="Creada por" icon="user">
                  <span className="text-sm text-white">
                    {displayValue(task.creatorName)}
                  </span>
                </FormField>

                <FormField label="Asignados" icon="user-plus">
                  <div className="flex flex-wrap items-center gap-1">
                    {task.assignees && task.assignees.length > 0 ? (
                      task.assignees.map((assignee, i) => {
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
                  </div>
                </FormField>
              </div>

              <div className="flex-1 space-y-4">
                <FormField label="Inicio" icon="calendar">
                  <span className="text-sm text-white">
                    {formatDate(task.startDate)}
                  </span>
                </FormField>
                <FormField label="Fin" icon="calendar">
                  <span className="text-sm text-white">
                    {task.endDate ? formatDate(task.endDate) : "—"}
                  </span>
                </FormField>
                <FormField label="Horas Estimadas" icon="hourglass-half">
                  <span className="text-sm text-white">
                    {displayValue(task.estimatedHours)}
                  </span>
                </FormField>
                <FormField label="Horas Reales" icon="check-circle">
                  <span className="text-sm text-white">
                    {displayValue(task.actualHours)}
                  </span>
                </FormField>
              </div>
            </div>

            <div className="mt-6">
              <label className="text-oc-text-gray mb-2 block text-sm font-medium">
                Descripción
              </label>
              <div className="bg-oc-neutral/30 border-oc-outline-light/60 min-h-[120px] w-full overflow-auto rounded-lg border p-3 text-sm">
                {task.description ? (
                  <p className="whitespace-pre-wrap text-white">
                    {task.description}
                  </p>
                ) : (
                  <p className="text-oc-text-gray italic">
                    No hay descripción disponible
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
