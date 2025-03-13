// app/store/slices/teamSlice.ts
import type { StateCreator } from "zustand";
import type { TeamSlice, TaskStore } from "../types";

export const createTeamSlice: StateCreator<TaskStore, [], [], TeamSlice> = (
  set,
  get
) => ({
  // Initial state
  teams: [],
  isLoadingTeams: false,
  error: null,

  // Actions - retained but deprecated in favor of initializeData
  fetchTeams: async () => {
    const { currentUser, teams } = get();

    // Check if we already have teams or if the user is not a manager
    if (!currentUser || teams.length > 0 || currentUser.role !== "manager")
      return;

    set({ isLoadingTeams: true });

    try {
      const response = await fetch("/api/teams/");
      if (!response.ok) {
        throw new Error("Error al obtener equipos");
      }
      const data = await response.json();
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
});
