// app/store/slices/teamSlice.ts
import type { StateCreator } from "zustand";
import type { StoreState, TaskStore } from "~/store/types";
import type { Team } from "~/types";

export interface TeamSlice extends StoreState {
  teams: Team[];
  isLoadingTeams: boolean;

  fetchTeams: () => Promise<void>;
}

export const createTeamSlice: StateCreator<TaskStore, [], [], TeamSlice> = (
  set,
  get
) => ({
  teams: [],
  isLoadingTeams: false,
  error: null,

  fetchTeams: async () => {
    const { currentUser, teams } = get();

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
