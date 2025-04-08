// app/components/CreateSprintModal.tsx
import { useState, useEffect } from "react";
import Portal from "../../Portal";
import useTaskStore from "~/store";
import { Modal } from "~/components/Modal";
import { FormField } from "../../FormField";
import { Select } from "../../Select";

interface CreateSprintModalProps {
  teamId: number | null;
  onClose: () => void;
  onSave: () => void;
}

export function CreateSprintModal({
  teamId,
  onClose,
  onSave,
}: CreateSprintModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(teamId);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const { createSprint, teams } = useTaskStore();

  useEffect(() => {
    console.log("CreateSprintModal mounted", teamId);
    setIsVisible(true);
    // Set default dates (2 weeks sprint)
    const today = new Date();
    const twoWeeksLater = new Date();
    twoWeeksLater.setDate(today.getDate() + 14);

    setStartDate(today.toISOString().split("T")[0]);
    setEndDate(twoWeeksLater.toISOString().split("T")[0]);
  }, [teamId]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 150);
  };

  const handleSubmit = async () => {
    const currentTeamId =
      teamId != null && !isNaN(teamId) ? teamId : selectedTeamId;
    if (!currentTeamId || !name || !startDate || !endDate) {
      setError("Todos los campos son obligatorios");
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      setError("La fecha de inicio debe ser anterior a la fecha de fin");
      return;
    }

    try {
      await createSprint({
        teamId: currentTeamId,
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

            {(teamId === null || isNaN(teamId)) &&
              teams &&
              teams.length > 0 && (
                <FormField label="Equipo" icon="users" className="mb-3 text-sm">
                  <Select
                    value={selectedTeamId ?? ""}
                    onChange={(e) => setSelectedTeamId(Number(e.target.value))}
                    options={[
                      { value: "", label: "Selecciona un equipo" },
                      ...teams.map((team: { id: number; name: string }) => ({
                        value: team.id,
                        label: team.name,
                      })),
                    ]}
                  />
                </FormField>
              )}

            <form className="flex h-full flex-col text-sm" noValidate={false}>
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

              <div className="my-2 mt-6">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="bg-oc-neutral/50 border-oc-outline-light/60 flex w-full items-center justify-center rounded-lg border py-2.5 text-sm text-white transition-all hover:bg-black"
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
