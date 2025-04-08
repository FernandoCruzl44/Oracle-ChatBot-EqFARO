// app/store/slices/preferencesSlice.ts
import type { StateCreator } from "zustand";
import { useCookies } from "react-cookie";

// Get the cookies instance (will be used outside React components)
let cookieHandler = {
  get: (name: string, defaultValue: any) => {
    try {
      const value = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${name}=`))
        ?.split("=")[1];

      return value || defaultValue;
    } catch (e) {
      return defaultValue;
    }
  },
  set: (name: string, value: string, options: any = {}) => {
    const maxAge = options.maxAge || 60 * 60 * 24 * 365; // Default 1 year
    document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
  },
};

export interface PreferencesSlice {
  // UI preferences
  viewMode: "table" | "kanban";
  isSidebarExpanded: boolean;

  // Actions
  setViewMode: (mode: "table" | "kanban") => void;
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
  initializeCookieHandler: (handler: typeof cookieHandler) => void;
}

export const createPreferencesSlice: StateCreator<PreferencesSlice> = (set) => {
  // Try to get initial values, but use defaults if not available
  const initialViewMode = cookieHandler.get("viewMode", "table") as
    | "table"
    | "kanban";
  const initialSidebarExpanded =
    cookieHandler.get("sidebarExpanded", "true") !== "false"; // Default to true

  return {
    // Initial state
    viewMode: initialViewMode,
    isSidebarExpanded: initialSidebarExpanded,

    // Actions
    setViewMode: (mode) => {
      cookieHandler.set("viewMode", mode);
      set({ viewMode: mode });
    },

    toggleSidebar: () => {
      set((state) => {
        const newValue = !state.isSidebarExpanded;
        cookieHandler.set("sidebarExpanded", String(newValue));
        return { isSidebarExpanded: newValue };
      });
    },

    setSidebarExpanded: (expanded) => {
      cookieHandler.set("sidebarExpanded", String(expanded));
      set({ isSidebarExpanded: expanded });
    },

    // Method to initialize cookie handler with React hooks when app starts
    initializeCookieHandler: (handler) => {
      cookieHandler = handler;
    },
  };
};
