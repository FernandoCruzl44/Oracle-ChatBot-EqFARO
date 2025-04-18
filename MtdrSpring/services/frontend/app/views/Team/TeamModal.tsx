import React, { useState, useEffect } from "react";
import type { Team } from "../../types";
import { Modal } from "../../components/Modal";
import { Button } from "../../components/Button";

interface TeamModalProps {
  team: Team | null;
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSave: (teamData: { name: string; description: string }) => void;
}

const TeamModal: React.FC<TeamModalProps> = ({
  team,
  isOpen,
  isSaving,
  onClose,
  onSave,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [teamData, setTeamData] = useState({ name: "", description: "" });
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (team) {
        setTeamData({
          name: team.name,
          description: team.description || "",
        });
      } else {
        setTeamData({ name: "", description: "" });
      }
      setErrorMessage("");
      setTimeout(() => {
        setIsVisible(true);
      }, 0);
    } else {
      setIsVisible(false);
    }
  }, [isOpen, team]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setTeamData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!teamData.name.trim()) {
      setErrorMessage("El nombre del equipo es requerido");
      return;
    }

    onSave(teamData);
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  return (
    <Modal
      className="h-auto max-h-[90vh] w-[500px] max-w-[90vw]"
      isVisible={isVisible}
      onClose={handleClose}
      handleClose={handleClose}
    >
      <div className="border-oc-outline-light/90 flex-1 overflow-hidden p-8">
        <h3 className="mb-6 text-lg font-medium text-white">
          {team ? "Editar equipo" : "Crear nuevo equipo"}
        </h3>

        {errorMessage && (
          <div className="mb-4 rounded-md border border-red-600 bg-red-500/10 p-3 text-sm text-red-400">
            <i className="fa fa-exclamation-circle mr-2"></i>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-stone-300"
            >
              Nombre del equipo <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={teamData.name}
              onChange={handleInputChange}
              className="border-oc-outline-light bg-oc-primary focus:border-oc-amber focus:ring-oc-amber w-full rounded-md border p-2 text-white"
              placeholder="Nombre del equipo"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-1 block text-sm font-medium text-stone-300"
            >
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              value={teamData.description}
              onChange={handleInputChange}
              className="border-oc-outline-light bg-oc-primary focus:border-oc-amber focus:ring-oc-amber w-full rounded-md border p-2 text-white"
              rows={3}
              placeholder="Descripción (opcional)"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button onClick={handleClose} className="px-2">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving} className="px-2">
              {isSaving ? (
                <span className="flex items-center">
                  <i className="fa fa-spinner fa-spin mr-2"></i> Guardando...
                </span>
              ) : team ? (
                "Actualizar"
              ) : (
                "Crear"
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default TeamModal;
