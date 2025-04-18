import React, { useState, useEffect, useRef, useMemo } from "react";
import type { ChangeEvent } from "react";
import { generateAvatarColor } from "../../lib/utils";
import type { Team, User } from "../../types";

interface TeamCardProps {
  team: Team;
  allUsers: User[];
  allTeams: Team[];
  searchTerm: string;
  selectedMembersMap: Record<number, number[]>;
  onMemberSelect: (teamId: number, memberId: number) => void;
  onSelectAllMembers: (
    teamId: number,
    membersInTeam: User[],
    checked: boolean,
  ) => void;
  onRoleChange: (userId: number, newRole: string) => void;
  onAssignTeam: (userId: number, teamId: number | null) => void;
  onEditTeam: (teamId: number) => void;
  onDeleteTeam: (teamId: number) => void;
  onAddMember: (teamId: number) => void;
  onViewProfile: (memberId: number) => void;
  onEditMember: (memberId: number) => void;
  onDeleteMember: (memberId: number) => void;
  isManager: boolean;
  teamRoles: string[];
}

export function TeamCard({
  team,
  allUsers,
  allTeams,
  searchTerm,
  selectedMembersMap,
  onMemberSelect,
  onSelectAllMembers,
  onRoleChange,
  onAssignTeam,
  onEditTeam,
  onDeleteTeam,
  onAddMember,
  onViewProfile,
  onEditMember,
  onDeleteMember,
  isManager,
  teamRoles,
}: TeamCardProps) {
  // Derived state: Get members for this specific team (memoized)
  const membersInTeam = useMemo(() => {
    return allUsers.filter((user) => user.teamId === team.id);
  }, [allUsers, team.id]);

  // Derived state: Filter members based on search term (memoized)
  const filteredMembersInTeam = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return membersInTeam; // Return all if no search term
    return membersInTeam.filter((member) =>
      member.name.toLowerCase().includes(term),
    );
  }, [membersInTeam, searchTerm]);

  // Derived state: Get selected members for this specific team (memoized)
  const selectedInTeam = useMemo(() => {
    return selectedMembersMap[team.id] || [];
  }, [selectedMembersMap, team.id]);

  // Memoize selection calculations
  const allInTeamSelected = useMemo(
    () =>
      membersInTeam.length > 0 &&
      selectedInTeam.length === membersInTeam.length,
    [membersInTeam.length, selectedInTeam.length],
  );

  const anyInTeamSelected = useMemo(
    () => selectedInTeam.length > 0,
    [selectedInTeam.length],
  );

  return (
    <>
      <div
        key={team.id}
        className="border-oc-outline-light bg-oc-primary overflow-hidden rounded-lg border"
      >
        {/* Team Header */}
        <div className="border-oc-outline-light flex items-center justify-between border-b bg-black/20 p-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-white">{team.name}</h2>
            <p className="text-sm text-stone-400">{team.description}</p>
            {isManager && (
              <>
                <button
                  onClick={() => onEditTeam(team.id)}
                  className="text-stone-400 hover:text-white"
                  title="Editar nombre/descripción del equipo"
                >
                  <i className="fa fa-pencil"></i>
                </button>
                <button
                  onClick={() => onDeleteTeam(team.id)}
                  className="text-red-500 hover:text-red-400"
                  title="Eliminar equipo"
                >
                  <i className="fa fa-trash"></i>
                </button>
              </>
            )}
          </div>
          {isManager && (
            <button
              onClick={() => onAddMember(team.id)}
              className="border-oc-outline-light bg-oc-primary flex items-center gap-1 rounded-lg border px-3 py-1 text-sm font-medium text-white transition duration-150 ease-in-out hover:bg-black"
            >
              <i className="fa fa-plus text-xs"></i> Miembro
            </button>
          )}
        </div>

        {/* Member Table */}
        <div className="overflow-x-auto">
          <table className="divide-oc-outline-light min-w-full divide-y">
            <thead className="bg-black/30">
              <tr>
                {/* <th scope="col" className="w-12 px-4 py-3 text-center">
                  {(() => {
                    const selectAllRef = useRef<HTMLInputElement>(null);

                    useEffect(() => {
                      if (selectAllRef.current) {
                        selectAllRef.current.indeterminate =
                          anyInTeamSelected && !allInTeamSelected;
                      }
                    }, [anyInTeamSelected, allInTeamSelected]);

                    return (
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        className="form-checkbox bg-oc-primary text-oc-amber focus:ring-oc-amber focus:ring-offset-oc-primary h-4 w-4 cursor-pointer rounded border-stone-500"
                        checked={allInTeamSelected}
                        disabled={membersInTeam.length === 0}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          onSelectAllMembers(
                            team.id,
                            membersInTeam,
                            e.target.checked,
                          )
                        }
                      />
                    );
                  })()}
                </th> */}
                <th
                  scope="col"
                  className="w-16 px-4 py-3 text-left text-xs font-semibold tracking-wider text-stone-300 uppercase"
                >
                  Avatar
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-stone-300 uppercase"
                >
                  Miembro
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
              {filteredMembersInTeam.map((member) => {
                const avatarStyle = generateAvatarColor(member.name);
                const initials = member.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase();
                const isSelected = selectedInTeam.includes(member.id);

                return (
                  <tr
                    key={member.id}
                    className={`transition duration-150 ease-in-out ${isSelected ? "bg-oc-amber/10" : "hover:bg-black/20"}`}
                  >
                    {/* <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        className="form-checkbox bg-oc-primary text-oc-amber focus:ring-oc-amber focus:ring-offset-oc-primary h-4 w-4 cursor-pointer rounded border-stone-500"
                        checked={isSelected}
                        onChange={() => onMemberSelect(team.id, member.id)}
                      />
                    </td> */}
                    <td className="px-4 py-3 text-center">
                      <div
                        className="mx-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-sm font-medium"
                        style={avatarStyle}
                        onClick={() => onViewProfile(member.id)}
                        title="Ver/Editar perfil"
                      >
                        {initials}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div
                        className="cursor-pointer text-sm font-medium text-white hover:underline"
                        onClick={() => onViewProfile(member.id)}
                        title="Ver/Editar perfil"
                      >
                        {member.name}
                      </div>
                      <div className="text-xs text-stone-400">
                        {member.email || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className={`inline-block rounded px-2 py-1 text-xs`}>
                        {member.role
                          ? member.role.charAt(0).toUpperCase() +
                            member.role.slice(1).toLowerCase()
                          : "Sin rol"}
                      </div>
                    </td>
                    <td className="space-x-2 px-4 py-3 text-right text-sm font-medium whitespace-nowrap">
                      <button
                        onClick={() => onViewProfile(member.id)}
                        className="text-stone-400 transition duration-150 ease-in-out hover:text-white"
                        title="Ver/Editar perfil"
                      >
                        <i className="fa fa-eye"></i>
                      </button>
                      {isManager && (
                        <>
                          <button
                            onClick={() => onDeleteMember(member.id)}
                            className="ml-2 text-red-500 transition duration-150 ease-in-out hover:text-red-400"
                            title="Eliminar usuario"
                          >
                            <i className="fa fa-trash"></i>
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredMembersInTeam.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-4 text-center text-stone-500 italic"
                  >
                    {membersInTeam.length === 0
                      ? "No hay miembros en este equipo."
                      : `No se encontraron miembros que coincidan con "${searchTerm}".`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
