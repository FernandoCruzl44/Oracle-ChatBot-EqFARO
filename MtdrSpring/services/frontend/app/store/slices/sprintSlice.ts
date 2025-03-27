// app/store/slices/sprintSlice.ts
import type { StateCreator } from "zustand";
import type { StoreState, TaskStore } from "~/store/types";
import type { Sprint, Task } from "~/types";

export interface SprintSlice extends StoreState {
  // State
  sprints: Sprint[];
  sprintTasks: Record<number, Task[]>;
  incompleteTasks: Record<number, Task[]>;
  isLoadingSprints: boolean;
  isLoadingSprintTasks: boolean;
  selectedSprintId: number | null;

  // Getters
  getSprintsByTeam: (teamId: number) => Sprint[];
  getSprintById: (sprintId: number) => Sprint | undefined;
  getTasksForSprint: (sprintId: number) => Task[];
  getIncompleteTasksForSprint: (sprintId: number) => Task[];

  // Sprint CRUD
  fetchSprints: (teamId?: number) => Promise<void>;
  fetchSprintDetails: (sprintId: number) => Promise<void>;
  fetchSprintTasks: (sprintId: number) => Promise<void>;
  fetchIncompleteSprintTasks: (sprintId: number) => Promise<void>;
  createSprint: (sprintData: Partial<Sprint>) => Promise<Sprint>;
  updateSprint: (
    sprintId: number,
    sprintData: Partial<Sprint>
  ) => Promise<void>;
  deleteSprint: (sprintId: number) => Promise<void>;

  // Task Assignment
  assignTasksToSprint: (
    sprintId: number,
    taskIds: number[],
    viewMode?: string
  ) => Promise<void>;
  removeTaskFromSprint: (
    sprintId: number,
    taskId: number,
    viewMode?: string
  ) => Promise<void>;

  // Sprint Transition
  completeSprint: (
    sprintId: number,
    action: "moveToBacklog" | "moveToNextSprint",
    nextSprintId?: number,
    viewMode?: string
  ) => Promise<void>;

  // UI State
  selectSprint: (sprintId: number | null) => void;
}

export const createSprintSlice: StateCreator<TaskStore, [], [], SprintSlice> = (
  set,
  get
) => ({
  // Initial state
  sprints: [],
  sprintTasks: {},
  incompleteTasks: {},
  isLoadingSprints: false,
  isLoadingSprintTasks: false,
  selectedSprintId: null,
  error: null,

  // Getters
  getSprintsByTeam: (teamId) => {
    return get().sprints.filter((sprint) => sprint.teamId === teamId);
  },

  getSprintById: (sprintId) => {
    return get().sprints.find((sprint) => sprint.id === sprintId);
  },

  getTasksForSprint: (sprintId) => {
    return get().sprintTasks[sprintId] || [];
  },

  getIncompleteTasksForSprint: (sprintId) => {
    return get().incompleteTasks[sprintId] || [];
  },

  // Sprint CRUD
  fetchSprints: async (teamId) => {
    set({ isLoadingSprints: true, error: null });
    try {
      const url = teamId ? `/api/sprints?teamId=${teamId}` : "/api/sprints";
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Error fetching sprints");
      }

      const data = await response.json();
      set({ sprints: data, isLoadingSprints: false });
    } catch (error) {
      console.error("Error fetching sprints:", error);
      set({
        error:
          error instanceof Error ? error.message : "Error fetching sprints",
        isLoadingSprints: false,
      });
    }
  },

  fetchSprintDetails: async (sprintId) => {
    set({ isLoadingSprints: true, error: null });
    try {
      const response = await fetch(`/api/sprints/${sprintId}`);

      if (!response.ok) {
        throw new Error("Error fetching sprint details");
      }

      const sprint = await response.json();
      set((state) => ({
        sprints: state.sprints.map((s) => (s.id === sprintId ? sprint : s)),
        isLoadingSprints: false,
      }));
    } catch (error) {
      console.error("Error fetching sprint details:", error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "Error fetching sprint details",
        isLoadingSprints: false,
      });
    }
  },

  fetchSprintTasks: async (sprintId) => {
    set({ isLoadingSprintTasks: true, error: null });
    try {
      const response = await fetch(`/api/sprints/${sprintId}/tasks`);

      if (!response.ok) {
        throw new Error("Error fetching sprint tasks");
      }

      const tasks = await response.json();
      set((state) => ({
        sprintTasks: {
          ...state.sprintTasks,
          [sprintId]: tasks,
        },
        isLoadingSprintTasks: false,
      }));
    } catch (error) {
      console.error("Error fetching sprint tasks:", error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "Error fetching sprint tasks",
        isLoadingSprintTasks: false,
      });
    }
  },

  fetchIncompleteSprintTasks: async (sprintId) => {
    set({ isLoadingSprintTasks: true, error: null });
    try {
      const response = await fetch(`/api/sprints/${sprintId}/incomplete-tasks`);

      if (!response.ok) {
        throw new Error("Error fetching incomplete tasks");
      }

      const tasks = await response.json();
      set((state) => ({
        incompleteTasks: {
          ...state.incompleteTasks,
          [sprintId]: tasks,
        },
        isLoadingSprintTasks: false,
      }));
    } catch (error) {
      console.error("Error fetching incomplete tasks:", error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "Error fetching incomplete tasks",
        isLoadingSprintTasks: false,
      });
    }
  },

  createSprint: async (sprintData) => {
    set({ isLoadingSprints: true, error: null });
    try {
      const response = await fetch("/api/sprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sprintData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error creating sprint");
      }

      const newSprint = await response.json();
      set((state) => ({
        sprints: [...state.sprints, newSprint],
        isLoadingSprints: false,
      }));

      return newSprint;
    } catch (error) {
      console.error("Error creating sprint:", error);
      set({
        error: error instanceof Error ? error.message : "Error creating sprint",
        isLoadingSprints: false,
      });
      throw error;
    }
  },

  updateSprint: async (sprintId, sprintData) => {
    set({ isLoadingSprints: true, error: null });
    try {
      const response = await fetch(`/api/sprints/${sprintId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sprintData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error updating sprint");
      }

      const updatedSprint = await response.json();
      set((state) => ({
        sprints: state.sprints.map((sprint) =>
          sprint.id === sprintId ? updatedSprint : sprint
        ),
        isLoadingSprints: false,
      }));
    } catch (error) {
      console.error("Error updating sprint:", error);
      set({
        error: error instanceof Error ? error.message : "Error updating sprint",
        isLoadingSprints: false,
      });
      throw error;
    }
  },

  deleteSprint: async (sprintId) => {
    set({ isLoadingSprints: true, error: null });
    try {
      const response = await fetch(`/api/sprints/${sprintId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error deleting sprint");
      }

      set((state) => ({
        sprints: state.sprints.filter((sprint) => sprint.id !== sprintId),
        sprintTasks: Object.fromEntries(
          Object.entries(state.sprintTasks).filter(
            ([id]) => Number(id) !== sprintId
          )
        ),
        incompleteTasks: Object.fromEntries(
          Object.entries(state.incompleteTasks).filter(
            ([id]) => Number(id) !== sprintId
          )
        ),
        isLoadingSprints: false,
      }));
    } catch (error) {
      console.error("Error deleting sprint:", error);
      set({
        error: error instanceof Error ? error.message : "Error deleting sprint",
        isLoadingSprints: false,
      });
      throw error;
    }
  },

  // Task Assignment
  assignTasksToSprint: async (sprintId, taskIds, viewMode = "all") => {
    set({ isLoadingSprintTasks: true, error: null });
    try {
      const response = await fetch(`/api/sprints/${sprintId}/tasks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error assigning tasks to sprint");
      }

      // Refresh sprint tasks after assignment
      await get().fetchSprintTasks(sprintId);

      // Also refresh tasks in the main task list
      await get().fetchTasks(viewMode);

      set({ isLoadingSprintTasks: false });
    } catch (error) {
      console.error("Error assigning tasks to sprint:", error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "Error assigning tasks to sprint",
        isLoadingSprintTasks: false,
      });
      throw error;
    }
  },

  removeTaskFromSprint: async (sprintId, taskId, viewMode = "all") => {
    set({ isLoadingSprintTasks: true, error: null });
    try {
      const response = await fetch(`/api/sprints/${sprintId}/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error removing task from sprint");
      }

      // Update the sprint tasks list
      set((state) => ({
        sprintTasks: {
          ...state.sprintTasks,
          [sprintId]: (state.sprintTasks[sprintId] || []).filter(
            (task) => task.id !== taskId
          ),
        },
        incompleteTasks: {
          ...state.incompleteTasks,
          [sprintId]: (state.incompleteTasks[sprintId] || []).filter(
            (task) => task.id !== taskId
          ),
        },
        isLoadingSprintTasks: false,
      }));

      // Refresh the main task list
      await get().fetchTasks(viewMode);
    } catch (error) {
      console.error("Error removing task from sprint:", error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "Error removing task from sprint",
        isLoadingSprintTasks: false,
      });
      throw error;
    }
  },

  // Sprint Transition
  completeSprint: async (sprintId, action, nextSprintId, viewMode = "all") => {
    set({ isLoadingSprints: true, error: null });
    try {
      const payload: any = { incompleteTasksAction: action };
      if (action === "moveToNextSprint" && nextSprintId) {
        payload.nextSprintId = nextSprintId;
      }

      const response = await fetch(`/api/sprints/${sprintId}/end`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error completing sprint");
      }

      // Update sprint status locally
      set((state) => ({
        sprints: state.sprints.map((sprint) =>
          sprint.id === sprintId ? { ...sprint, status: "COMPLETED" } : sprint
        ),
        isLoadingSprints: false,
      }));

      // Refresh tasks list
      await get().fetchTasks(viewMode);

      // If moved to next sprint, refresh that sprint's tasks
      if (action === "moveToNextSprint" && nextSprintId) {
        await get().fetchSprintTasks(nextSprintId);
      }
    } catch (error) {
      console.error("Error completing sprint:", error);
      set({
        error:
          error instanceof Error ? error.message : "Error completing sprint",
        isLoadingSprints: false,
      });
      throw error;
    }
  },

  // UI State
  selectSprint: (sprintId) => {
    set({ selectedSprintId: sprintId });
    if (sprintId !== null) {
      get().fetchSprintTasks(sprintId);
    }
  },
});
