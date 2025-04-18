// app/store/slices/teamSlice.ts
import type { StateCreator } from "zustand";
import type { StoreState, TaskStore } from "~/store/types";
import type { Team } from "~/types";
import { api } from "~/lib/api";

export interface TeamSlice extends StoreState {
  teams: Team[];
  isLoadingTeams: boolean;

  fetchTeams: () => Promise<void>;
  fetchUserTeams: () => Promise<void>;
  createTeam: (teamData: {
    name: string;
    description?: string;
  }) => Promise<Team | null>;
  updateTeam: (
    teamId: number,
    teamData: { name: string; description?: string },
  ) => Promise<Team | null>;
  deleteTeam: (teamId: number) => Promise<void>;
}

export const createTeamSlice: StateCreator<TaskStore, [], [], TeamSlice> = (
  set,
  get,
) => ({
  teams: [],
  isLoadingTeams: false,
  error: null,

  fetchTeams: async () => {
    const { currentUser, teams } = get();

    if (!currentUser || teams.length > 0) return;

    set({ isLoadingTeams: true });

    try {
      // Fetch all teams (used by managers)
      const data = await api.get("/teams/");
      set({ teams: data, isLoadingTeams: false });
    } catch (error) {
      console.error("Error fetching teams:", error);
      set({
        error:
          error instanceof Error ? error.message : "Error al obtener equipos",
        isLoadingTeams: false,
      });
    }
  },

  fetchUserTeams: async () => {
    const { currentUser } = get();

    if (!currentUser) return;

    set({ isLoadingTeams: true });

    try {
      // Use the correct endpoint we created in the backend
      const data = await api.get(`/teams/user/${currentUser.id}`);
      set({ teams: data, isLoadingTeams: false });
    } catch (error) {
      console.error("Error fetching user teams:", error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "Error al obtener equipos del usuario",
        isLoadingTeams: false,
      });
    }
  },

  createTeam: async (teamData) => {
    const token = get().getToken();
    if (!token || get().currentUser?.role !== "manager") {
      set({ error: "Unauthorized" });
      return null;
    }
    set({ isLoadingTeams: true });
    try {
      const newTeam = await api.post("/teams/", teamData);
      set((state) => ({
        teams: [...state.teams, newTeam],
        isLoadingTeams: false,
        error: null,
      }));
      return newTeam;
    } catch (error) {
      console.error("Error creating team:", error);
      set({
        error: error instanceof Error ? error.message : "Error al crear equipo",
        isLoadingTeams: false,
      });
      return null;
    }
  },

  updateTeam: async (teamId, teamData) => {
    const token = get().getToken();
    if (!token || get().currentUser?.role !== "manager") {
      set({ error: "Unauthorized" });
      return null;
    }
    set({ isLoadingTeams: true }); // Indicate loading specific to this action if needed
    try {
      const updatedTeam = await api.put(`/teams/${teamId}`, teamData);
      set((state) => ({
        teams: state.teams.map((team) =>
          team.id === teamId ? { ...team, ...updatedTeam } : team,
        ),
        isLoadingTeams: false, // Reset general loading or use specific flags
        error: null,
      }));
      return updatedTeam;
    } catch (error) {
      console.error(`Error updating team ${teamId}:`, error);
      set({
        error:
          error instanceof Error ? error.message : "Error al actualizar equipo",
        isLoadingTeams: false,
      });
      return null;
    }
  },

  deleteTeam: async (teamId) => {
    const token = get().getToken();
    if (!token || get().currentUser?.role !== "manager") {
      set({ error: "Unauthorized" });
      return;
    }
    set({ isLoadingTeams: true }); // Indicate loading
    try {
      await api.delete(`/teams/${teamId}`);
      set((state) => ({
        teams: state.teams.filter((team) => team.id !== teamId),
        isLoadingTeams: false,
        error: null,
      }));
      // Optionally, re-assign users from the deleted team or handle as needed
      get().fetchUsers(); // Refresh users as their team assignment might change implicitly
    } catch (error) {
      console.error(`Error deleting team ${teamId}:`, error);
      set({
        error:
          error instanceof Error ? error.message : "Error al eliminar equipo",
        isLoadingTeams: false,
      });
    }
  },
});
