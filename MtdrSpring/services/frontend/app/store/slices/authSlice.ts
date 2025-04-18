// app/store/slices/authSlice.ts
import type { StateCreator } from "zustand";
import type { StoreState, TaskStore } from "~/store/types";
import type { User } from "~/types";
import { api } from "~/lib/api";

// Helper function to safely access localStorage
const getLocalStorage = () => {
  if (typeof window !== "undefined") {
    return window.localStorage;
  }
  return null;
};

export interface AuthSlice extends StoreState {
  token: string | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;

  login: (email: string, password: string) => Promise<User | null>;
  register: (userData: Partial<User>) => Promise<User | null>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  getToken: () => string | null;
}

export const createAuthSlice: StateCreator<TaskStore, [], [], AuthSlice> = (
  set,
  get,
) => {
  // Safely try to get token from localStorage using the standardized key
  const storage = getLocalStorage();
  const storedToken = storage ? storage.getItem("token") : null;

  return {
    token: storedToken,
    isAuthenticated: !!storedToken,
    isAuthLoading: false,
    error: null,

    login: async (email, password) => {
      set({ isAuthLoading: true, error: null });
      try {
        const data = await api.login(email, password);

        set({
          token: data.token,
          isAuthenticated: true,
          currentUser: data.user,
          isAuthLoading: false,
        });

        return data.user;
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : "Login failed",
          isAuthLoading: false,
          isAuthenticated: false,
          token: null,
        });

        const storage = getLocalStorage();
        if (storage) {
          storage.removeItem("token");
        }

        throw error; // Make sure to re-throw the error
      }
    },

    register: async (userData) => {
      set({ isAuthLoading: true, error: null });
      try {
        const user = await api.post("/auth/signup", userData, {
          requiresAuth: false,
        });

        set({ isAuthLoading: false });

        return user;
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : "Registration failed",
          isAuthLoading: false,
        });
        return null;
      }
    },

    logout: () => {
      // api.logout already removes "token" from localStorage
      api.logout();

      set({
        token: null,
        isAuthenticated: false,
        currentUser: null,
      });

      // Only redirect if in browser
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    },

    checkAuth: async () => {
      const storage = getLocalStorage();
      const token = get().token || (storage ? storage.getItem("token") : null);

      if (!token) {
        set({ isAuthenticated: false, currentUser: null, token: null });
        return false;
      }

      // Ensure the state token is also set if found in storage but not state
      if (!get().token && token) {
        set({ token: token });
      }

      try {
        const user = await api.get("/users/me");
        set({ currentUser: user, isAuthenticated: true });
        return true;
      } catch (error) {
        if (storage) {
          storage.removeItem("token");
        }

        set({
          token: null,
          isAuthenticated: false,
          currentUser: null,
          error:
            error instanceof Error ? error.message : "Authentication failed",
        });
        return false;
      }
    },

    getToken: () => {
      const stateToken = get().token;
      if (stateToken) {
        return stateToken;
      }
      const storage = getLocalStorage();
      return storage ? storage.getItem("token") : null;
    },
  };
};
