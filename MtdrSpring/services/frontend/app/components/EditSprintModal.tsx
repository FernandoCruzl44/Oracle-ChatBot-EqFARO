// app/components/EditSprintModal.tsx
import { useState, useEffect } from "react";
import Portal from "./Portal";
import useTaskStore from "~/store";
import type { Sprint } from "~/types";

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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre del Sprint"
                  className="text-lg font-bold border-b border-oc-outline-light/60 pb-3 mb-4 bg-transparent focus:outline-none"
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

                  <div className="flex justify-between mt-6">
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center"
                    >
                      <i className="fa fa-trash mr-2"></i>
                      Eliminar Sprint
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="px-4 py-2 bg-oc-brown text-white rounded hover:bg-oc-brown/90 transition-all"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
