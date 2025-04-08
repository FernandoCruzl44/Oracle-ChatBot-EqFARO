// app/components/EditSprintModal.tsx
import { useState, useEffect } from "react";
import Portal from "../../Portal";
import useTaskStore from "~/store";
import type { Sprint } from "~/types";
import { Modal } from "~/components/Modal";

interface EditSprintModalProps {
  sprint: Sprint;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
}

export function EditSprintModal({
  sprint,
  onClose,
  onSave,
  onDelete,
}: EditSprintModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [name, setName] = useState(sprint.name);
  const [startDate, setStartDate] = useState(sprint.startDate);
  const [endDate, setEndDate] = useState(sprint.endDate);
  const [error, setError] = useState("");
  const { updateSprint, deleteSprint } = useTaskStore();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 150);
  };

  const handleSubmit = async () => {
    if (!name || !startDate || !endDate) {
      setError("Todos los campos son obligatorios");
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      setError("La fecha de inicio debe ser anterior a la fecha de fin");
      return;
    }

    try {
      await updateSprint(sprint.id, {
        name,
        startDate,
        endDate,
      });
      onSave();
      handleClose();
    } catch (err) {
      setError("Error al actualizar el sprint");
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteSprint(sprint.id);
      onDelete();
      handleClose();
    } catch (err) {
      setError("Error al eliminar el sprint");
      console.error(err);
    }
  };

  return (
    <Portal>
      <Modal
        isVisible={isVisible}
        onClose={handleClose}
        handleClose={handleClose}
        className="w-xl"
      >
        <div className="flex-1 overflow-hidden p-8 pb-6">
          <div className="flex h-full flex-col">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del Sprint"
              className="border-oc-outline-light/60 mb-4 border-b bg-transparent pb-3 text-lg font-bold text-white focus:outline-none"
              required
              title="Este campo es obligatorio"
            />

            <form
              className="flex h-full flex-col pt-3 text-sm"
              noValidate={false}
            >
              <div className="flex-1 space-y-4 overflow-y-auto transition-all duration-150">
                <div className="flex items-center">
                  <div className="text-oc-brown/60 w-32">
                    <i className="fa fa-calendar mr-2 translate-y-1"></i>
                    Fecha inicio
                  </div>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="fill-white px-2 py-1 text-xs text-white"
                    required
                  />
                </div>

                <div className="flex items-center">
                  <div className="text-oc-brown/60 w-32">
                    <i className="fa fa-calendar mr-2 translate-y-1"></i>
                    Fecha fin
                  </div>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="fill-white px-2 py-1 text-xs text-white"
                    required
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-red-100 bg-red-50 p-2 text-sm text-red-500">
                    <i className="fa fa-warning mr-1"></i>
                    {error}
                  </div>
                )}
              </div>

              <div className="my-2 mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex w-[50px] items-center justify-center rounded-lg border border-red-900/60 bg-red-900/50 py-2.5 text-sm text-white transition-all hover:bg-red-950"
                >
                  <i className="fa fa-trash"></i>
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="bg-oc-neutral/50 border-oc-outline-light/60 flex w-full items-center justify-center rounded-lg border py-2.5 text-sm text-white transition-all hover:bg-black"
                >
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </Modal>
    </Portal>
  );
}
