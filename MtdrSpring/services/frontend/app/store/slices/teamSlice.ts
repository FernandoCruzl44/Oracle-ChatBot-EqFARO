// app/store/slices/teamSlice.ts
import type { StateCreator } from "zustand";
import type { StoreState, TaskStore } from "~/store/types";
import type { Team } from "~/types";
import { api } from "~/lib/api";

export interface TeamSlice extends StoreState {
  teams: Team[];
  isLoadingTeams: boolean;

  fetchTeams: () => Promise<void>;
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

    if (!currentUser || teams.length > 0 || currentUser.role !== "manager")
      return;

    set({ isLoadingTeams: true });

    try {
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
});
