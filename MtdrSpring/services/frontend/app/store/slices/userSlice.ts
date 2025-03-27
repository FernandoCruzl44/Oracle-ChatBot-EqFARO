// app/store/slices/userSlice.ts
import type { StateCreator } from "zustand";
import type { StoreState, TaskStore } from "~/store/types";
import type { User } from "~/types";

export interface UserSlice extends StoreState {
  users: User[];
  currentUser: User | null;
  isLoadingUsers: boolean;

  fetchCurrentUser: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  getCurrentUser: () => User | null;
  handleChangeUser: (userId: number) => Promise<void>;
}

export const createUserSlice: StateCreator<TaskStore, [], [], UserSlice> = (
  set,
  get
) => ({
  users: [],
  currentUser: null,
  isLoadingUsers: false,
  error: null,

  getCurrentUser: () => get().currentUser,

  fetchCurrentUser: async () => {
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

  handleChangeUser: async (userId: number) => {
    if (!userId) return;

    const users = get().users;
    const selectedUser = users.find((user) => user.id === Number(userId));
    if (!selectedUser) return;

    try {
      const res = await fetch(`/api/identity/set/${userId}`, {
        method: "POST",
      });
      await res.json();

      set({ currentUser: selectedUser });

      window.location.reload();
    } catch (error) {
      console.error("Error changing user:", error);
      set({
        error:
          error instanceof Error ? error.message : "Error al cambiar usuario",
      });
    }
  },
});
