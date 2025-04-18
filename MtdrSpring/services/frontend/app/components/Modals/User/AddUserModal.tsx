import React, { useState, useEffect } from "react";
import type { Team } from "~/types";
import { Modal } from "../../Modal";
import { Button } from "../../Button";

interface AddUserModalProps {
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSave: (userData: any) => void; // Consider defining a specific type for new user data
  allTeams: Team[];
  teamRoles: string[]; // Assuming global roles for simplicity, adjust if needed
  initialTeamId?: number | null;
}

const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  isSaving,
  onClose,
  onSave,
  allTeams,
  teamRoles, // Use global roles for the main role field
  initialTeamId,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    password: "",
    role: "developer", // Default role
    teamId: initialTeamId || "", // Pre-select team if provided
  });
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens, respecting initialTeamId
      setUserData({
        name: "",
        email: "",
        password: "",
        role: "developer",
        teamId: initialTeamId || "",
      });
      setErrorMessage("");
      // Animation timing
      setTimeout(() => {
        setIsVisible(true);
      }, 0);
    } else {
      setIsVisible(false);
    }
  }, [isOpen, initialTeamId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (
      !userData.name.trim() ||
      !userData.email.trim() ||
      !userData.password.trim()
    ) {
      setErrorMessage("Nombre, Email, y Contraseña son requeridos.");
      return;
    }
    // Basic email validation
    if (!/\S+@\S+\.\S+/.test(userData.email)) {
      setErrorMessage("Por favor ingrese un email válido.");
      return;
    }

    // Convert teamId back to number or null before saving
    const dataToSave = {
      ...userData,
      teamId: userData.teamId ? parseInt(userData.teamId.toString(), 10) : null,
    };

    onSave(dataToSave);
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200); // Match transition duration
  };

  return (
    <Modal
      className="h-auto max-h-[90vh] w-[500px] max-w-[90vw]" // Adjust size as needed
      isVisible={isVisible}
      onClose={handleClose}
      handleClose={handleClose}
    >
      <div className="border-oc-outline-light/90 flex-1 overflow-hidden p-8">
        <h3 className="mb-6 text-lg font-medium text-white">
          Crear Nuevo Usuario
        </h3>

        {errorMessage && (
          <div className="mb-4 rounded-md border border-red-600 bg-red-500/10 p-3 text-sm text-red-400">
            <i className="fa fa-exclamation-circle mr-2"></i>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label
              htmlFor="add-name"
              className="mb-1 block text-sm font-medium text-stone-300"
            >
              Nombre Completo <span className="text-red-500">*</span>
            </label>
            <input
              id="add-name"
              name="name"
              type="text"
              value={userData.name}
              onChange={handleInputChange}
              required
              className="border-oc-outline-light bg-oc-primary focus:border-oc-amber focus:ring-oc-amber w-full rounded-md border p-2 text-white"
              placeholder="Nombre del nuevo usuario"
            />
          </div>

          {/* Email Field */}
          <div>
            <label
              htmlFor="add-email"
              className="mb-1 block text-sm font-medium text-stone-300"
            >
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="add-email"
              name="email"
              type="email"
              value={userData.email}
              onChange={handleInputChange}
              required
              className="border-oc-outline-light bg-oc-primary focus:border-oc-amber focus:ring-oc-amber w-full rounded-md border p-2 text-white"
              placeholder="Email del nuevo usuario"
            />
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="add-password"
              className="mb-1 block text-sm font-medium text-stone-300"
            >
              Contraseña <span className="text-red-500">*</span>
            </label>
            <input
              id="add-password"
              name="password"
              type="password"
              value={userData.password}
              onChange={handleInputChange}
              required
              className="border-oc-outline-light bg-oc-primary focus:border-oc-amber focus:ring-oc-amber w-full rounded-md border p-2 text-white"
              placeholder="Contraseña temporal"
            />
          </div>

          {/* Role Field */}
          <div>
            <label
              htmlFor="add-role"
              className="mb-1 block text-sm font-medium text-stone-300"
            >
              Rol Global
            </label>
            <select
              id="add-role"
              name="role"
              value={userData.role}
              onChange={handleInputChange}
              className="border-oc-outline-light bg-oc-primary focus:border-oc-amber focus:ring-oc-amber w-full rounded-md border p-2 text-white"
            >
              {/* Use global roles like 'developer', 'manager' */}
              <option value="developer">Developer</option>
              <option value="manager">Manager</option>
              {/* Add other global roles if available */}
            </select>
          </div>

          {/* Team Assignment Field */}
          <div>
            <label
              htmlFor="add-teamId"
              className="mb-1 block text-sm font-medium text-stone-300"
            >
              Asignar a Equipo (Opcional)
            </label>
            <select
              id="add-teamId"
              name="teamId"
              value={userData.teamId}
              onChange={handleInputChange}
              className="border-oc-outline-light bg-oc-primary focus:border-oc-amber focus:ring-oc-amber w-full rounded-md border p-2 text-white"
            >
              <option value="">Sin equipo</option>
              {allTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* Create/Cancel Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button onClick={handleClose} className="px-2">
              Cancelar
            </Button>
            <Button disabled={isSaving} className="px-2">
              {isSaving ? (
                <span className="flex items-center">
                  <i className="fa fa-spinner fa-spin mr-2"></i> Creando...
                </span>
              ) : (
                "Crear Usuario"
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default AddUserModal;
