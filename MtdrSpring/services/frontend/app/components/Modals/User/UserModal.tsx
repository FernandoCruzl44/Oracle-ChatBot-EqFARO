import React, { useState, useEffect } from "react";
import type { User, Team } from "~/types";
import { Modal } from "../../Modal"; // Assuming Modal component exists
import { Button } from "../../Button"; // Assuming Button component exists

interface UserModalProps {
  user: User;
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSave: (userData: Partial<User>) => void;
  isManager: boolean;
  allTeams: Team[];
  teamRoles: string[]; // Assuming roles like 'developer', 'manager', etc.
  onAssignTeam: (userId: number, teamId: number | null) => void;
  onRoleChange: (userId: number, role: string) => void; // Assuming role is a simple string for now
}

const UserModal: React.FC<UserModalProps> = ({
  user,
  isOpen,
  isSaving,
  onClose,
  onSave,
  isManager,
  allTeams,
  teamRoles,
  onAssignTeam,
  onRoleChange,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [editableUser, setEditableUser] = useState<Partial<User>>({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setEditableUser({ ...user });
      setIsEditing(false);
      // Animation timing
      setTimeout(() => {
        setIsVisible(true);
      }, 0);
    } else {
      setIsVisible(false);
    }
  }, [isOpen, user]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    const newValue =
      name === "teamId" ? (value ? parseInt(value, 10) : null) : value;

    setEditableUser((prev) => {
      const updatedUser = { ...prev, [name]: newValue };
      // Check if changes were made compared to the original user prop
      const hasChanged = Object.keys(updatedUser).some(
        (key) =>
          key in user &&
          JSON.stringify(updatedUser[key as keyof User]) !==
            JSON.stringify(user[key as keyof User]),
      );
      setIsEditing(hasChanged);
      return updatedUser;
    });
  };

  const handleSaveClick = () => {
    // Separate API calls for different fields if needed, or bundle them
    // For simplicity, we call onSave with all potentially changed fields
    onSave(editableUser);

    // If team or role changed, call specific handlers (optional, depends on backend)
    // This might be redundant if onSave handles everything
    if (editableUser.teamId !== user.teamId) {
      onAssignTeam(user.id, editableUser.teamId ?? null);
    }
    if (editableUser.role !== user.role) {
      onRoleChange(user.id, editableUser.role || ""); // Ensure role is not undefined
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200); // Match transition duration
  };

  // Determine which fields are editable
  const canEditName = isManager; // Allow self-edit name
  const canEditEmail = isManager; // Only manager can edit email (example)
  const canEditRole = isManager;
  const canEditTeam = isManager;

  return (
    <Modal
      className="h-auto max-h-[90vh] w-[500px] max-w-[90vw]" // Adjust size as needed
      isVisible={isVisible}
      onClose={handleClose}
      handleClose={handleClose}
    >
      <div className="border-oc-outline-light/90 flex-1 overflow-hidden p-8">
        <h3 className="mb-6 text-lg font-medium text-white">
          {isManager ? "Editar Perfil de Usuario" : "Ver Perfil"}
        </h3>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveClick();
          }}
          className="space-y-4"
        >
          {/* Name Field */}
          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-stone-300"
            >
              Nombre Completo
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={editableUser.name || ""}
              onChange={handleInputChange}
              readOnly={!canEditName}
              className={`border-oc-outline-light bg-oc-primary focus:border-oc-amber focus:ring-oc-amber w-full rounded-md border p-2 text-white ${!canEditName ? "cursor-not-allowed opacity-70" : ""}`}
            />
          </div>

          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-stone-300"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={editableUser.email || ""}
              onChange={handleInputChange}
              readOnly={!canEditEmail}
              className={`border-oc-outline-light bg-oc-primary focus:border-oc-amber focus:ring-oc-amber w-full rounded-md border p-2 text-white ${!canEditEmail ? "cursor-not-allowed opacity-70" : ""}`}
            />
          </div>

          {/* Role Field (Manager Only) */}
          {isManager && (
            <div>
              <label
                htmlFor="role"
                className="mb-1 block text-sm font-medium text-stone-300"
              >
                Rol Global
              </label>
              <select
                id="role"
                name="role"
                value={editableUser.role || ""}
                onChange={handleInputChange}
                disabled={!canEditRole}
                className={`border-oc-outline-light bg-oc-primary focus:border-oc-amber focus:ring-oc-amber w-full rounded-md border p-2 text-white ${!canEditRole ? "cursor-not-allowed opacity-70" : ""}`}
              >
                <option value="">Seleccionar Rol...</option>
                {/* Assuming global roles might be different or fetched elsewhere */}
                <option value="developer">Developer</option>
                <option value="manager">Manager</option>
                {/* Add other global roles as needed */}
              </select>
            </div>
          )}

          {/* Team Assignment (Manager Only) */}
          {isManager && (
            <div>
              <label
                htmlFor="teamId"
                className="mb-1 block text-sm font-medium text-stone-300"
              >
                Equipo
              </label>
              <select
                id="teamId"
                name="teamId"
                value={editableUser.teamId || ""} // Use empty string for "No Team"
                onChange={handleInputChange}
                disabled={!canEditTeam}
                className={`border-oc-outline-light bg-oc-primary focus:border-oc-amber focus:ring-oc-amber w-full rounded-md border p-2 text-white ${!canEditTeam ? "cursor-not-allowed opacity-70" : ""}`}
              >
                <option value="">Sin equipo</option>
                {allTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Team Role (Visible to all, editable by manager) */}
          {/* This might be redundant if global role dictates team role */}
          {/* Or could be specific roles within a team context */}
          {/* <div>
            <label htmlFor="teamRole" className="mb-1 block text-sm font-medium text-stone-300">
              Rol en Equipo
            </label>
            <select
              id="teamRole"
              name="teamRole"
              value={editableUser.teamRole || ""}
              onChange={handleInputChange}
              disabled={!isManager} // Only manager can change team role
              className={`border-oc-outline-light bg-oc-primary focus:border-oc-amber focus:ring-oc-amber w-full rounded-md border p-2 text-white ${!isManager ? "cursor-not-allowed opacity-70" : ""}`}
            >
              <option value="">Seleccionar Rol de Equipo...</option>
              {teamRoles.map((role) => (
                <option key={role} value={role}>
                  {role} // Capitalize or format as needed
                </option>
              ))}
            </select>
          </div> */}

          {/* Save/Close Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button className="px-2" type="button" onClick={handleClose}>
              Cerrar
            </Button>
            {(canEditName || canEditEmail || canEditRole || canEditTeam) && (
              <Button
                className="px-2"
                disabled={!isEditing || isSaving}
                isEditing={isEditing} // Pass isEditing to Button if it uses it
              >
                {isSaving ? (
                  <span className="flex items-center">
                    <i className="fa fa-spinner fa-spin mr-2"></i> Guardando...
                  </span>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default UserModal;
