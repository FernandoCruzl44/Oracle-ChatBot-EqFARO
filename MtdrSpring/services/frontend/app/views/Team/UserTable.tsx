// components/UserTable.tsx
import React from "react";
import { generateAvatarColor } from "../../lib/utils";
import type { Team, User } from "../../types";

interface UserTableProps {
  title: string;
  description?: string;
  users: User[];
  searchTerm: string;
  allTeams?: Team[];
  onViewProfile: (userId: number) => void;
  onAssignTeam?: (userId: number, teamId: number | null) => void;
  onDeleteUser?: (userId: number) => void;
  isManager?: boolean;
  teamRoles?: string[];
  showAddButton?: boolean;
  onAddMember?: (teamId?: number) => void;
  teamId?: number;
  className?: string;
  emptyMessage?: string;
}

const UserTable: React.FC<UserTableProps> = ({
  title,
  description,
  users,
  searchTerm,
  onViewProfile,
  onDeleteUser,
  isManager = false,
  showAddButton = false,
  onAddMember,
  teamId,
  className = "",
  emptyMessage = "No hay usuarios para mostrar.",
}) => {
  const filteredUsers = searchTerm
    ? users.filter((user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : users;

  if (users.length === 0) {
    return null;
  }

  return (
    <div
      className={`border-oc-outline-light bg-oc-primary overflow-hidden rounded-lg border ${className}`}
    >
      <div className="border-oc-outline-light flex items-center justify-between border-b bg-black/20 p-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {description && (
            <p className="text-sm text-stone-400">{description}</p>
          )}
        </div>
        {showAddButton && isManager && onAddMember && (
          <button
            onClick={() => onAddMember(teamId)}
            className="border-oc-outline-light bg-oc-primary flex items-center gap-1 rounded-lg border px-3 py-1 text-sm font-medium text-white transition duration-150 ease-in-out hover:bg-black"
          >
            <i className="fa fa-plus text-xs"></i> Miembro
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="divide-oc-outline-light min-w-full divide-y">
          <thead className="bg-black/30">
            <tr>
              <th
                scope="col"
                className="w-16 px-4 py-3 text-left text-xs font-semibold tracking-wider text-stone-300 uppercase"
              >
                Avatar
              </th>
              <th
                scope="col"
                className="w-[800px] px-4 py-3 text-left text-xs font-semibold tracking-wider text-stone-300 uppercase"
              >
                {teamId ? "Miembro" : "Usuario"}
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-stone-300 uppercase"
              >
                Rol
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-stone-300 uppercase"
              >
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-oc-outline-light divide-y">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
                const avatarStyle = generateAvatarColor(user.name);
                const initials = user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase();

                return (
                  <tr
                    key={user.id}
                    className="transition duration-150 ease-in-out hover:bg-black/20"
                  >
                    <td className="px-4 py-3 text-center">
                      <div
                        className="border-oc-outline-light/60 mx-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border text-sm font-semibold"
                        style={avatarStyle}
                        onClick={() => onViewProfile(user.id)}
                        title="Ver/Editar perfil"
                      >
                        {initials}
                      </div>
                    </td>
                    <td
                      className="cursor-pointer px-4 py-3 whitespace-nowrap"
                      onClick={() => onViewProfile(user.id)}
                    >
                      <div
                        className="text-sm font-medium text-white hover:underline"
                        title="Ver/Editar perfil"
                      >
                        {user.name}
                      </div>
                      <div className="w-[100px] text-xs text-stone-400">
                        {user.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div
                        className={`inline-block rounded px-2 py-1 text-xs ${
                          user.role === "manager"
                            ? "bg-blue-500/20 text-blue-300"
                            : "bg-green-500/20 text-green-300"
                        }`}
                      >
                        {user.role
                          ? user.role.charAt(0).toUpperCase() +
                            user.role.slice(1).toLowerCase()
                          : "Sin rol"}
                      </div>
                    </td>
                    <td className="space-x-2 px-4 py-3 text-right text-sm font-medium whitespace-nowrap">
                      <button
                        onClick={() => onViewProfile(user.id)}
                        className="text-stone-400 transition duration-150 ease-in-out hover:text-white"
                        title="Ver/Editar perfil"
                      >
                        <i className="fa fa-eye"></i>
                      </button>
                      {isManager && onDeleteUser && (
                        <button
                          onClick={() => onDeleteUser(user.id)}
                          className="ml-2 text-red-500 transition duration-150 ease-in-out hover:text-red-400"
                          title="Eliminar usuario"
                        >
                          <i className="fa fa-trash"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="py-4 text-center text-stone-500 italic"
                >
                  {searchTerm
                    ? `No se encontraron usuarios que coincidan con "${searchTerm}".`
                    : emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;
