// app/components/CreateSprintModal.tsx
import { useState, useEffect } from "react";
import Portal from "../../Portal";
import useTaskStore from "~/store";
import { Modal } from "~/components/Modal";

interface CreateSprintModalProps {
  teamId: number;
  onClose: () => void;
  onSave: () => void;
}

export function CreateSprintModal({
  teamId,
  onClose,
  onSave,
}: CreateSprintModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const { createSprint } = useTaskStore();

  useEffect(() => {
    setIsVisible(true);
    // Set default dates (2 weeks sprint)
    const today = new Date();
    const twoWeeksLater = new Date();
    twoWeeksLater.setDate(today.getDate() + 14);

    setStartDate(today.toISOString().split("T")[0]);
    setEndDate(twoWeeksLater.toISOString().split("T")[0]);
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
      await createSprint({
        teamId,
        name,
        startDate,
        endDate,
        status: "PLANNED",
      });
      onSave();
      handleClose();
    } catch (err) {
      setError("Error al crear el sprint");
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

              <div className="my-2 mt-6">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full text-sm py-2.5 bg-oc-neutral/50 border border-oc-outline-light/60 rounded-lg hover:bg-black transition-all flex justify-center items-center text-white"
                >
                  <span>Crear Sprint</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </Modal>
    </Portal>
  );
}
