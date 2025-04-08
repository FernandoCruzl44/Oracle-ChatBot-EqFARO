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
  // --- CHANGE HERE ---
  const storedToken = storage ? storage.getItem("token") : null;

  return {
    token: storedToken,
    isAuthenticated: !!storedToken,
    isAuthLoading: false,
    error: null,

    login: async (email, password) => {
      set({ isAuthLoading: true, error: null });
      try {
        // api.login already stores the token under "token" in localStorage
        const data = await api.login(email, password);

        // --- REMOVE REDUNDANT STORAGE or ensure consistency ---
        // No need to set it again here if api.login does it,
        // but ensure the state is updated correctly.
        // const storage = getLocalStorage();
        // if (storage) {
        //   storage.setItem("token", data.token); // Use "token"
        // }

        set({
          token: data.token, // Update state token
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
        // Ensure token is removed on login failure
        const storage = getLocalStorage();
        if (storage) {
          // --- CHANGE HERE ---
          storage.removeItem("token");
        }
        return null;
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

      // --- REMOVE REDUNDANT REMOVAL or ensure consistency ---
      // const storage = getLocalStorage();
      // if (storage) {
      //   storage.removeItem("token"); // Use "token"
      // }

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
      // --- CHANGE HERE ---
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
        // api.get uses api.request which correctly looks for "token"
        const user = await api.get("/users/me");
        set({ currentUser: user, isAuthenticated: true });
        return true;
      } catch (error) {
        // api.request handles token removal on 401/403, but we ensure state is cleared
        if (storage) {
          // --- CHANGE HERE ---
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
      // Prioritize state, then check localStorage as a fallback during initialization
      const stateToken = get().token;
      if (stateToken) {
        return stateToken;
      }
      const storage = getLocalStorage();
      // --- CHANGE HERE ---
      return storage ? storage.getItem("token") : null;
    },
  };
};
