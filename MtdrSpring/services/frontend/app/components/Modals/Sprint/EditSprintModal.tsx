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
        <div className="flex-1 p-8 pb-6 overflow-hidden">
          <div className="flex flex-col h-full">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del Sprint"
              className="text-lg text-white font-bold border-b border-oc-outline-light/60 pb-3 mb-4 bg-transparent focus:outline-none"
              required
              title="Este campo es obligatorio"
            />

            <form
              className="pt-3 text-sm flex flex-col h-full"
              noValidate={false}
            >
              <div className="space-y-4 flex-1 overflow-y-auto transition-all duration-150">
                <div className="flex items-center">
                  <div className="w-32 text-oc-brown/60">
                    <i className="fa fa-calendar mr-2 translate-y-1"></i>
                    Fecha inicio
                  </div>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-2 py-1 text-white text-xs fill-white"
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
                    className="px-2 py-1 text-white text-xs fill-white"
                    required
                  />
                </div>

                {error && (
                  <div className="text-red-500 text-sm bg-red-50 p-2 rounded-lg border border-red-100">
                    <i className="fa fa-warning mr-1"></i>
                    {error}
                  </div>
                )}
              </div>

              <div className="my-2 mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-[50px] text-sm py-2.5 bg-red-900/50 border border-red-900/60 rounded-lg hover:bg-red-950 transition-all flex justify-center items-center text-white"
                >
                  <i className="fa fa-trash"></i>
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full text-sm py-2.5 bg-oc-neutral/50 border border-oc-outline-light/60 rounded-lg hover:bg-black transition-all flex justify-center items-center text-white"
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
