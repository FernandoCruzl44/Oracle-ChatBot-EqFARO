// views/TeamView.tsx
import { useState, useEffect, useCallback } from "react";
import useTaskStore from "../../store";
import type { Team, User } from "../../types";
import TeamSkeletonLoader from "../../components/Skeletons/TeamSkeletonLoader";
import TeamModal from "./TeamModal";
import UserModal from "~/components/Modals/User/UserModal";
import AddUserModal from "~/components/Modals/User/AddUserModal";
import UserTable from "./UserTable";

function TeamView() {
  const {
    teams,
    users,
    currentUser,
    teamRoles,
    isLoadingTeams,
    isLoadingUsers,
    isLoadingTeamRoles,
    isInitialized,
    initializeData,
    fetchTeams,
    fetchUserTeams,
    fetchTeamRoles,
    updateUserTeamRole,
    assignUserToTeam,
    createTeam,
    updateTeam,
    deleteTeam,
    updateUser,
    deleteUser,
    register,
    fetchUsers,
  } = useTaskStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<
    Record<number, number[]>
  >({});
  const [error, setError] = useState<string | null>(null);

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isSavingTeam, setIsSavingTeam] = useState(false);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUserForModal, setSelectedUserForModal] = useState<User | null>(
    null,
  );
  const [isSavingUser, setIsSavingUser] = useState(false);

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isSavingNewUser, setIsSavingNewUser] = useState(false);
  const [initialTeamIdForNewUser, setInitialTeamIdForNewUser] = useState<
    number | null
  >(null);

  useEffect(() => {
    setError(null);
    if (!isInitialized) {
      console.log("TeamView: Initializing data...");
      initializeData();
    }

    fetchTeamRoles();

    if (currentUser) {
      try {
        if (currentUser.role === "manager") {
          fetchTeams().catch((err) => {
            console.error("Error fetching teams:", err);
            setError("Error fetching teams. Please try again later.");
          });
          if (!users || users.length === 0) {
            fetchUsers().catch((err) => {
              console.error("Error fetching users:", err);
              setError("Error fetching users. Please try again later.");
            });
          }
        } else {
          fetchUserTeams().catch((err) => {
            console.error("Error fetching user teams:", err);
            setError("Error fetching your teams. Please try again later.");
          });
        }
      } catch (err) {
        console.error("Error in teams initialization:", err);
        setError("An unexpected error occurred. Please try again later.");
      }
    }
  }, [
    initializeData,
    isInitialized,
    currentUser,
    fetchTeams,
    fetchUserTeams,
    fetchTeamRoles,
    fetchUsers,
    users?.length,
  ]);

  const handleMemberSelect = (teamId: number, memberId: number) => {
    setSelectedMembers((prev) => {
      const currentSelection = prev[teamId] || [];
      const newSelection = currentSelection.includes(memberId)
        ? currentSelection.filter((id) => id !== memberId)
        : [...currentSelection, memberId];
      return {
        ...prev,
        [teamId]: newSelection,
      };
    });
  };

  const handleSelectAllMembers = (
    teamId: number,
    membersInTeam: User[],
    checked: boolean,
  ) => {
    setSelectedMembers((prev) => ({
      ...prev,
      [teamId]: checked ? membersInTeam.map((m) => m.id) : [],
    }));
  };

  const handleRoleChange = useCallback(
    (userId: number, newRole: string) => {
      updateUserTeamRole(userId, newRole)
        .then(() => {
          console.log(`User ${userId} role updated to ${newRole}`);
        })
        .catch((error) => {
          console.error("Failed to update user role:", error);
        });
    },
    [updateUserTeamRole],
  );

  const handleAssignTeam = useCallback(
    (userId: number, teamId: number | null) => {
      assignUserToTeam(userId, teamId)
        .then(() => {
          console.log(`User ${userId} assigned to team ${teamId || "none"}`);
        })
        .catch((error) => {
          console.error("Failed to assign user to team:", error);
        });
    },
    [assignUserToTeam],
  );

  const handleAddTeam = () => {
    setEditingTeam(null);
    setIsTeamModalOpen(true);
  };

  const handleEditTeam = (teamId: number) => {
    const teamToEdit = teams?.find((t) => t.id === teamId);
    if (teamToEdit) {
      setEditingTeam(teamToEdit);
      setIsTeamModalOpen(true);
    }
  };

  const handleSaveTeam = async (teamData: {
    name: string;
    description: string;
  }) => {
    setIsSavingTeam(true);
    try {
      if (editingTeam) {
        await updateTeam(editingTeam.id, teamData);
      } else {
        await createTeam(teamData);
      }
      setIsTeamModalOpen(false);
      setEditingTeam(null);
    } catch (error) {
      console.error("Failed to save team:", error);
    } finally {
      setIsSavingTeam(false);
    }
  };

  const handleDeleteTeam = async (teamId: number) => {
    if (window.confirm("Are you sure you want to delete this team?")) {
      try {
        await deleteTeam(teamId);
      } catch (error) {
        console.error("Failed to delete team:", error);
      }
    }
  };

  const handleAddMember = (teamId?: number) => {
    setInitialTeamIdForNewUser(teamId || null);
    setIsAddUserModalOpen(true);
  };

  const handleSaveNewUser = async (userData: any) => {
    setIsSavingNewUser(true);
    try {
      const newUser = await register({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role || "developer",
      } as any);
      if (newUser && userData.teamId) {
        await assignUserToTeam(newUser.id, userData.teamId);
      }
      await Promise.all([
        fetchUsers(),
        currentUser?.role === "manager" ? fetchTeams() : fetchUserTeams(),
      ]);
      setIsAddUserModalOpen(false);
    } catch (error) {
      console.error("Failed to create user:", error);
    } finally {
      setIsSavingNewUser(false);
    }
  };

  const handleViewOrEditUser = (userId: number) => {
    const userToView = users?.find((u) => u.id === userId);
    if (userToView) {
      setSelectedUserForModal(userToView);
      setIsUserModalOpen(true);
    }
  };

  const handleSaveUser = async (userData: Partial<User>) => {
    if (!selectedUserForModal) return;
    setIsSavingUser(true);
    try {
      await updateUser(selectedUserForModal.id, {
        name: userData.name,
        email: userData.email,
        role: userData.role,
      });
      setIsUserModalOpen(false);
      setSelectedUserForModal(null);
    } catch (error) {
      console.error("Failed to update user:", error);
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (userId === currentUser?.id) {
      alert("You cannot delete yourself.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteUser(userId);
      } catch (error) {
        console.error("Failed to delete user:", error);
      }
    }
  };

  const isManager = currentUser?.role === "manager";
  const allTeams = teams || [];
  const hasTeams = allTeams.length > 0;

  const isLoading =
    isLoadingTeams || isLoadingUsers || isLoadingTeamRoles || !isInitialized;

  const managers = users?.filter((user) => user.role === "manager") || [];
  const hasManagers = managers.length > 0;

  const unassignedUsers =
    users?.filter((user) => user.teamId === null && user.role !== "manager") ||
    [];
  const hasUnassignedUsers = unassignedUsers.length > 0;

  const renderEmptyState = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="mb-2 text-red-500">
            <i className="fa fa-exclamation-circle fa-2x"></i>
          </div>
          <p className="mb-4 text-red-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="border-oc-outline-light bg-oc-primary flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium text-white transition duration-150 ease-in-out hover:bg-black"
          >
            <i className="fa fa-refresh"></i>
            Reintentar
          </button>
        </div>
      );
    }

    if (isManager) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="mb-4 text-stone-500">No hay equipos creados todavía.</p>
          <button
            onClick={handleAddTeam}
            className="border-oc-outline-light bg-oc-primary flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium text-white transition duration-150 ease-in-out hover:bg-black"
          >
            <i className="fa fa-plus"></i>
            Crear Primer Equipo
          </button>
        </div>
      );
    }

    return (
      <div className="py-10 text-center">
        <div className="space-y-2 text-stone-500">
          <p>No perteneces a ningún equipo.</p>
          <p>Contacta con tu manager para ser asignado a un equipo.</p>
        </div>
      </div>
    );
  };

  return (
    <div
      className="h-full bg-[#181614] p-6"
      style={{
        backgroundImage:
          "url(https://static.oracle.com/cdn/apex/20.2.0.00.20/themes/theme_42/1.6/images/rw/textures/texture-13.png)",
        backgroundRepeat: "repeat",
      }}
    >
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-medium text-white">Equipos</h1>
          </div>
        </div>

        {(hasTeams || isManager) && (
          <div className="flex items-center justify-between py-4 pt-6">
            <div className="relative w-72">
              <input
                type="text"
                placeholder="Buscar miembro"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-oc-outline-light bg-oc-primary focus:border-oc-amber focus:ring-oc-amber w-full rounded-lg border py-2 pr-10 pl-8 text-sm text-white placeholder-stone-400 focus:outline-none"
                disabled={!hasTeams}
              />
              <i className="fa fa-search absolute top-1/2 left-3 -translate-y-1/2 transform text-white"></i>
            </div>
            {isManager && (
              <button
                onClick={handleAddTeam}
                className="border-oc-outline-light bg-oc-primary flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium text-white transition duration-150 ease-in-out hover:bg-black"
              >
                <i className="fa fa-plus"></i>
                {hasTeams ? "Agregar Equipo" : "Crear Primer Equipo"}
              </button>
            )}
          </div>
        )}

        <div className="bg-oc-primary border-oc-outline-light flex flex-1 flex-col overflow-hidden rounded-lg border text-sm">
          <div className="flex-grow overflow-y-auto px-4 py-4">
            <div className="space-y-6">
              {isLoading ? (
                <TeamSkeletonLoader cards={3} rowsPerCard={4} />
              ) : !hasTeams && !hasUnassignedUsers ? (
                renderEmptyState()
              ) : (
                <>
                  {hasManagers && (
                    <UserTable
                      title="Administradores"
                      users={managers}
                      searchTerm={searchTerm}
                      onViewProfile={handleViewOrEditUser}
                      isManager={isManager}
                      className="mb-6"
                    />
                  )}
                  {allTeams.map((team) => {
                    const membersInTeam = users.filter(
                      (user) => user.teamId === team.id,
                    );

                    return (
                      <UserTable
                        key={team.id}
                        title={team.name}
                        description={team.description}
                        users={membersInTeam}
                        searchTerm={searchTerm}
                        onViewProfile={handleViewOrEditUser}
                        onDeleteUser={handleDeleteUser}
                        isManager={isManager}
                        showAddButton={true}
                        onAddMember={handleAddMember}
                        teamId={team.id}
                        className="mb-6"
                        emptyMessage="No hay miembros en este equipo."
                      />
                    );
                  })}
                  {hasUnassignedUsers && (
                    <UserTable
                      title="Usuarios Sin Equipo"
                      users={unassignedUsers}
                      searchTerm={searchTerm}
                      onViewProfile={handleViewOrEditUser}
                      onDeleteUser={isManager ? handleDeleteUser : undefined}
                      isManager={isManager}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <TeamModal
        team={editingTeam}
        isOpen={isTeamModalOpen}
        isSaving={isSavingTeam}
        onClose={() => setIsTeamModalOpen(false)}
        onSave={handleSaveTeam}
      />

      {selectedUserForModal && (
        <UserModal
          user={selectedUserForModal}
          isOpen={isUserModalOpen}
          isSaving={isSavingUser}
          onClose={() => {
            setIsUserModalOpen(false);
            setSelectedUserForModal(null);
          }}
          onSave={handleSaveUser}
          isManager={isManager}
          allTeams={teams || []}
          teamRoles={teamRoles || []}
          onAssignTeam={handleAssignTeam}
          onRoleChange={handleRoleChange}
        />
      )}

      {isManager && (
        <AddUserModal
          isOpen={isAddUserModalOpen}
          isSaving={isSavingNewUser}
          onClose={() => setIsAddUserModalOpen(false)}
          onSave={handleSaveNewUser}
          allTeams={teams || []}
          teamRoles={teamRoles || []}
          initialTeamId={initialTeamIdForNewUser}
        />
      )}
    </div>
  );
}

export default TeamView;
