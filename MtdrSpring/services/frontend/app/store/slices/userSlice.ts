// app/store/slices/userSlice.ts
import type { StateCreator } from "zustand";
import type { UserSlice, TaskStore } from "../types";

export const createUserSlice: StateCreator<TaskStore, [], [], UserSlice> = (
  set,
  get
) => ({
  // Initial state
  users: [],
  currentUser: null,
  isLoadingUsers: false,
  error: null,

  getCurrentUser: () => get().currentUser,

  // Actions - retained but deprecated in favor of initializeData
  fetchCurrentUser: async () => {
    // Check if we already have a user
    if (get().currentUser) return;

    set({ isLoadingUsers: true, error: null });

    try {
      const res = await fetch("/api/identity/current");

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(
            "No has seleccionado un usuario. Por favor selecciona un usuario para ver las tareas."
          );
        }
        throw new Error("Error al obtener usuario actual");
      }

      const data = await res.json();

      if (data.message !== "No identity set") {
        set({ currentUser: data, isLoadingUsers: false });
      } else {
        set({
          error:
            "No has seleccionado un usuario. Por favor selecciona un usuario para ver las tareas.",
          isLoadingUsers: false,
        });
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "Error al obtener usuario actual",
        isLoadingUsers: false,
      });
    }
  },

  fetchUsers: async () => {
    // Check if we already have users
    if (get().users.length > 0) return;

    set({ isLoadingUsers: true });

    try {
      const response = await fetch("/api/users/");
      if (!response.ok) {
        throw new Error("Error al cargar usuarios");
      }
      const data = await response.json();
      set({ users: data, isLoadingUsers: false });
    } catch (error) {
      console.error("Error fetching users:", error);
      set({
        error:
          error instanceof Error ? error.message : "Error al cargar usuarios",
        isLoadingUsers: false,
      });
    }
  },
});
