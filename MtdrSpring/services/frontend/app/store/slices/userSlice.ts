// app/store/slices/userSlice.ts (updated)
import type { StateCreator } from "zustand";
import type { StoreState, TaskStore } from "~/store/types";
import type { User } from "~/types";
import { api } from "~/lib/api";

export interface UserSlice extends StoreState {
  users: User[];
  currentUser: User | null;
  isLoadingUsers: boolean;
  teamRoles: string[];
  isLoadingTeamRoles: boolean;

  fetchCurrentUser: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchTeamRoles: () => Promise<void>;
  getCurrentUser: () => User | null;
  updateUserTeamRole: (userId: number, teamRole: string) => Promise<void>;
  assignUserToTeam: (userId: number, teamId: number | null) => Promise<void>;
  updateUser: (
    userId: number,
    userData: Partial<Pick<User, "name" | "email" | "role">>,
  ) => Promise<User | null>;
  deleteUser: (userId: number) => Promise<void>;
}

export const createUserSlice: StateCreator<TaskStore, [], [], UserSlice> = (
  set,
  get,
) => ({
  users: [],
  currentUser: null,
  isLoadingUsers: false,
  teamRoles: [],
  isLoadingTeamRoles: false,
  error: null,

  getCurrentUser: () => get().currentUser,

  fetchCurrentUser: async () => {
    if (get().currentUser) return;

    const token = get().getToken();
    if (!token) {
      set({
        error: "Not authenticated",
        isLoadingUsers: false,
      });
      return;
    }

    set({ isLoadingUsers: true, error: null });

    try {
      const user = await api.get("/users/me");
      set({ currentUser: user, isLoadingUsers: false });
    } catch (error) {
      console.error("Error fetching current user:", error);
      set({
        error:
          error instanceof Error ? error.message : "Error getting current user",
        isLoadingUsers: false,
      });

      // Handle authentication errors
      if (
        error instanceof Error &&
        (error.message.includes("unauthorized") ||
          error.message.includes("token") ||
          error.message.includes("expired"))
      ) {
        get().logout();
      }
    }
  },

  fetchUsers: async () => {
    if (get().users.length > 0) return;

    const token = get().getToken();
    if (!token) return;

    set({ isLoadingUsers: true });

    try {
      const users = await api.get("/users/");
      set({ users, isLoadingUsers: false });
    } catch (error) {
      console.error("Error fetching users:", error);
      set({
        error: error instanceof Error ? error.message : "Error loading users",
        isLoadingUsers: false,
      });
    }
  },

  fetchTeamRoles: async () => {
    // Skip if we already have team roles
    if (get().teamRoles.length > 0) return;

    const token = get().getToken();
    if (!token) return;

    set({ isLoadingTeamRoles: true });

    try {
      const roles = await api.get("/roles/team-roles");
      set({ teamRoles: roles, isLoadingTeamRoles: false });
    } catch (error) {
      console.error("Error fetching team roles:", error);
      set({
        error:
          error instanceof Error ? error.message : "Error loading team roles",
        isLoadingTeamRoles: false,
      });
    }
  },

  updateUserTeamRole: async (userId: number, teamRole: string) => {
    const token = get().getToken();
    if (!token) return;

    try {
      // Call the API to update the user's team role
      const updatedUser = await api.put(`/users/${userId}/team-role`, {
        teamRole,
      });

      // Update the user in the store
      set((state) => ({
        users: state.users.map((user) =>
          user.id === userId ? { ...user, teamRole } : user,
        ),
      }));

      // If this is the current user, update the current user as well
      if (get().currentUser?.id === userId) {
        set((state) => ({
          currentUser: state.currentUser
            ? { ...state.currentUser, teamRole }
            : null,
        }));
      }

      return updatedUser;
    } catch (error) {
      console.error("Error updating user team role:", error);
      throw error;
    }
  },

  assignUserToTeam: async (userId: number, teamId: number | null) => {
    const token = get().getToken();
    if (!token) return;

    try {
      // Call the API to assign the user to a team
      await api.put(`/users/${userId}/team-assignment`, {
        teamId,
      });

      // Fetch fresh data for both users and teams
      const [users, teams] = await Promise.all([
        api.get("/users/"),
        api.get("/teams/"),
      ]);

      // Update both users and teams in the store
      set((state) => ({
        users,
        teams,
        // Update currentUser if it's the user being modified
        currentUser:
          state.currentUser?.id === userId
            ? users.find((u: User) => u.id === userId) || state.currentUser
            : state.currentUser,
      }));
    } catch (error) {
      console.error("Error assigning user to team:", error);
      throw error;
    }
  },

  updateUser: async (userId, userData) => {
    const token = get().getToken();
    if (!token) {
      set({ error: "Unauthorized" });
      return null;
    }
    // Add manager check if only managers can update certain fields
    // if (get().currentUser?.role !== 'manager' && userData.role) { ... }

    set({ isLoadingUsers: true });
    try {
      const updatedUser = await api.put(`/users/${userId}`, userData);
      set((state) => ({
        users: state.users.map((user) =>
          user.id === userId ? { ...user, ...updatedUser } : user,
        ),
        currentUser:
          state.currentUser?.id === userId
            ? { ...state.currentUser, ...updatedUser }
            : state.currentUser,
        isLoadingUsers: false,
        error: null,
      }));
      return updatedUser;
    } catch (error) {
      console.error(`Error updating user ${userId}:`, error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "Error al actualizar usuario",
        isLoadingUsers: false,
      });
      return null;
    }
  },

  deleteUser: async (userId: number) => {
    const token = get().getToken();
    if (!token || get().currentUser?.role !== "manager") {
      set({ error: "Unauthorized" });
      return;
    }
    if (userId === get().currentUser?.id) {
      set({ error: "Cannot delete yourself" });
      return; // Prevent self-deletion
    }

    set({ isLoadingUsers: true });
    try {
      await api.delete(`/users/${userId}`);
      set((state) => ({
        users: state.users.filter((user) => user.id !== userId),
        isLoadingUsers: false,
        error: null,
      }));
    } catch (error) {
      console.error(`Error deleting user ${userId}:`, error);
      set({
        error:
          error instanceof Error ? error.message : "Error al eliminar usuario",
        isLoadingUsers: false,
      });
    }
  },
});
