// app/store/slices/preferencesSlice.ts
import type { StateCreator } from "zustand";

let cookieHandler = {
  get: (name: string, defaultValue: any) => {
    try {
      if (typeof document === "undefined") return defaultValue;

      const value = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${name}=`))
        ?.split("=")[1];

      if (value) {
        try {
          return decodeURIComponent(value);
        } catch (e) {
          return value;
        }
      }
      return defaultValue;
    } catch (e) {
      console.error("Cookie get error:", e);
      return defaultValue;
    }
  },
  set: (name: string, value: string, options: any = {}) => {
    try {
      if (typeof document === "undefined") return;

      const maxAge = options.maxAge || 60 * 60 * 24 * 365;
      const encodedValue = encodeURIComponent(value);
      document.cookie = `${name}=${encodedValue}; path=/; max-age=${maxAge}; SameSite=Lax`;
    } catch (e) {
      console.error("Cookie set error:", e);
    }
  },
};

export interface PreferencesSlice {
  viewMode: "table" | "kanban";
  isSidebarExpanded: boolean;
  foldedColumns: Record<string, boolean>;

  setViewMode: (mode: "table" | "kanban") => void;
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
  toggleColumnFolded: (columnName: string) => void;
  setColumnFolded: (columnName: string, isFolded: boolean) => void;
  initializeCookieHandler: (handler: typeof cookieHandler) => void;
}

export const createPreferencesSlice: StateCreator<PreferencesSlice> = (
  set,
  get,
) => {
  const initialViewMode = cookieHandler.get("viewMode", "kanban") as
    | "table"
    | "kanban";

  const initialSidebarExpanded =
    cookieHandler.get("sidebarExpanded", "true") !== "false";

  let initialFoldedColumns: Record<string, boolean> = {};
  try {
    const storedValue = cookieHandler.get("foldedColumns", "{}");
    const parsed = JSON.parse(storedValue);
    if (parsed && typeof parsed === "object") {
      initialFoldedColumns = parsed;
    }
  } catch (e) {
    console.error("Error parsing foldedColumns cookie:", e);
    initialFoldedColumns = {};
  }

  return {
    viewMode: initialViewMode,
    isSidebarExpanded: initialSidebarExpanded,
    foldedColumns: initialFoldedColumns,

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

    toggleColumnFolded: (columnName) => {
      set((state) => {
        const newFoldedColumns = { ...state.foldedColumns };
        newFoldedColumns[columnName] = !(newFoldedColumns[columnName] === true);

        try {
          cookieHandler.set("foldedColumns", JSON.stringify(newFoldedColumns));
        } catch (e) {
          console.error("Error saving foldedColumns to cookie:", e);
        }

        return { foldedColumns: newFoldedColumns };
      });
    },

    setColumnFolded: (columnName, isFolded) => {
      set((state) => {
        const newFoldedColumns = { ...state.foldedColumns };
        newFoldedColumns[columnName] = Boolean(isFolded);

        try {
          cookieHandler.set("foldedColumns", JSON.stringify(newFoldedColumns));
        } catch (e) {
          console.error("Error saving foldedColumns to cookie:", e);
        }

        return { foldedColumns: newFoldedColumns };
      });
    },

    initializeCookieHandler: (handler) => {
      cookieHandler = handler;
    },
  };
};
