// app/store/slices/sprintSlice.ts
import type { StateCreator } from "zustand";
import type { StoreState, TaskStore } from "~/store/types";
import type { Sprint, Task } from "~/types";
import { api } from "~/lib/api";

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
    sprintData: Partial<Sprint>,
  ) => Promise<void>;
  deleteSprint: (sprintId: number) => Promise<void>;

  // Task Assignment
  assignTasksToSprint: (
    sprintId: number,
    taskIds: number[],
    viewMode?: string,
  ) => Promise<void>;
  removeTaskFromSprint: (
    sprintId: number,
    taskId: number,
    viewMode?: string,
  ) => Promise<void>;

  // Sprint Transition
  completeSprint: (
    sprintId: number,
    action: "moveToBacklog" | "moveToNextSprint",
    nextSprintId?: number,
    viewMode?: string,
  ) => Promise<void>;

  // UI State
  selectSprint: (sprintId: number | null) => void;
}

export const createSprintSlice: StateCreator<TaskStore, [], [], SprintSlice> = (
  set,
  get,
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
      const url = teamId ? `/sprints?teamId=${teamId}` : "/sprints";
      const data = await api.get(url);
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
      const sprint = await api.get(`/sprints/${sprintId}`);
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
      const tasks = await api.get(`/sprints/${sprintId}/tasks`);
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
      const tasks = await api.get(`/sprints/${sprintId}/incomplete-tasks`);
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
      const newSprint = await api.post("/sprints", sprintData);
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
      const updatedSprint = await api.put(`/sprints/${sprintId}`, sprintData);
      set((state) => ({
        sprints: state.sprints.map((sprint) =>
          sprint.id === sprintId ? updatedSprint : sprint,
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
      await api.delete(`/sprints/${sprintId}`);
      set((state) => ({
        sprints: state.sprints.filter((sprint) => sprint.id !== sprintId),
        sprintTasks: Object.fromEntries(
          Object.entries(state.sprintTasks).filter(
            ([id]) => Number(id) !== sprintId,
          ),
        ),
        incompleteTasks: Object.fromEntries(
          Object.entries(state.incompleteTasks).filter(
            ([id]) => Number(id) !== sprintId,
          ),
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
      await api.put(`/sprints/${sprintId}/tasks`, { taskIds });

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
      await api.delete(`/sprints/${sprintId}/tasks/${taskId}`);

      // Update the sprint tasks list
      set((state) => ({
        sprintTasks: {
          ...state.sprintTasks,
          [sprintId]: (state.sprintTasks[sprintId] || []).filter(
            (task) => task.id !== taskId,
          ),
        },
        incompleteTasks: {
          ...state.incompleteTasks,
          [sprintId]: (state.incompleteTasks[sprintId] || []).filter(
            (task) => task.id !== taskId,
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

      await api.put(`/sprints/${sprintId}/end`, payload);

      // Update sprint status locally
      set((state) => ({
        sprints: state.sprints.map((sprint) =>
          sprint.id === sprintId ? { ...sprint, status: "COMPLETED" } : sprint,
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
