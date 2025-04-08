// app/store/slices/userSlice.ts (updated)
import type { StateCreator } from "zustand";
import type { StoreState, TaskStore } from "~/store/types";
import type { User } from "~/types";
import { api } from "~/lib/api";

export interface UserSlice extends StoreState {
  users: User[];
  currentUser: User | null;
  isLoadingUsers: boolean;

  fetchCurrentUser: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  getCurrentUser: () => User | null;
}

export const createUserSlice: StateCreator<TaskStore, [], [], UserSlice> = (
  set,
  get,
) => ({
  users: [],
  currentUser: null,
  isLoadingUsers: false,
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
});
