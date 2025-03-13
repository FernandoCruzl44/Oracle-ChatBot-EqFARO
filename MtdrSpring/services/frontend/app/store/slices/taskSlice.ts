// app/store/slices/taskSlice.ts
import type { StateCreator } from "zustand";
import type { Task } from "~/types";
import type { TaskSlice, TaskStore } from "../types";

export const createTaskSlice: StateCreator<TaskStore, [], [], TaskSlice> = (
  set,
  get
) => ({
  // Initial state
  tasks: [],
  isLoadingTasks: false,
  isInitialized: false,
  error: null,
  selectedTaskId: null,

  // Getters
  getTaskById: (id) => {
    return get().tasks.find((task) => task.id === id);
  },

  // Initialize data - load everything at once
  initializeData: async () => {
    // Early return if already initialized or currently loading
    if (get().isInitialized || get().isLoadingTasks) return;

    set({ error: null, isLoadingTasks: true });

    try {
      // Step 1: Fetch current user
      const userResponse = await fetch("/api/identity/current");

      if (!userResponse.ok) {
        if (userResponse.status === 404) {
          throw new Error(
            "No has seleccionado un usuario. Por favor selecciona un usuario para ver las tareas."
          );
        }
        throw new Error("Error al obtener usuario actual");
      }

      const userData = await userResponse.json();

      if (userData.message === "No identity set") {
        set({
          error:
            "No has seleccionado un usuario. Por favor selecciona un usuario para ver las tareas.",
          isLoadingTasks: false,
        });
        return;
      }

      // We have a user, now fetch tasks
      let tasksUrl = "/api/tasks/?view_mode=";
      tasksUrl += userData.role === "manager" ? "all" : "assigned";

      // Fetch tasks and teams in parallel
      const fetchTasks = fetch(tasksUrl).then((res) =>
        res.ok ? res.json() : []
      );

      // Only fetch teams if user is a manager
      const fetchTeams =
        userData.role === "manager"
          ? fetch("/api/teams/").then((res) => (res.ok ? res.json() : []))
          : Promise.resolve([]);

      // Fetch users
      const fetchUsers = fetch("/api/users/").then((res) =>
        res.ok ? res.json() : []
      );

      // Wait for all data to load
      const [tasks, teams, users] = await Promise.all([
        fetchTasks,
        fetchTeams,
        fetchUsers,
      ]);

      // Update all state at once to avoid multiple renders
      set({
        currentUser: userData,
        tasks,
        teams,
        users,
        isLoadingTasks: false,
        isInitialized: true, // Mark as initialized
      });
    } catch (error) {
      console.error("Error initializing data:", error);
      set({
        error:
          error instanceof Error ? error.message : "Error al cargar los datos",
        isLoadingTasks: false,
      });
    }
  },

  // Actions for subsequent data loading
  fetchTasks: async (viewMode, teamId) => {
    const { currentUser, isLoadingTasks } = get();

    // Don't fetch if already loading or no user
    if (!currentUser || isLoadingTasks) return;

    set({ isLoadingTasks: true, error: null });

    let url = "/api/tasks/?";

    if (currentUser.role === "manager") {
      if (viewMode === "all") {
        url += "view_mode=all";
      } else {
        url += `view_mode=team&team_id=${teamId}`;
      }
    } else {
      if (viewMode === "all") {
        url += "view_mode=assigned";
      } else if (viewMode === "team") {
        url += "view_mode=team";
      }
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Error al cargar las tareas");
      }
      const data = await response.json();
      set({ tasks: data, isLoadingTasks: false });
    } catch (error) {
      console.error("Error fetching tasks:", error);
      set({
        error:
          error instanceof Error ? error.message : "Error al cargar las tareas",
        isLoadingTasks: false,
      });
    }
  },

  createTask: async (taskData) => {
    const { currentUser } = get();

    const newTask = {
      ...taskData,
      created_by_id: currentUser?.id,
    };

    try {
      const response = await fetch("/api/tasks/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al crear la tarea");
      }

      const createdTask = await response.json();

      // Add the creator details to the task for UI consistency
      const processedTask = {
        ...createdTask,
        created_by:
          createdTask.created_by ||
          createdTask.creator?.name ||
          currentUser?.name ||
          "Usuario",
      };

      // Optimistically update the tasks list
      set((state) => ({
        tasks: [...state.tasks, processedTask],
      }));

      return processedTask;
    } catch (error) {
      console.error("Error creating task:", error);
      set({
        error:
          error instanceof Error ? error.message : "Error al crear la tarea",
      });
      throw error;
    }
  },

  updateTask: async (taskId, taskData) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar la tarea");
      }

      const updatedTask = await response.json();

      // Update the task in the store
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId ? { ...task, ...updatedTask } : task
        ),
      }));

      return updatedTask;
    } catch (error) {
      console.error("Error updating task:", error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "Error al actualizar la tarea",
      });
      throw error;
    }
  },

  deleteTask: async (taskId) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar la tarea");
      }

      // Remove the task from state
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== taskId),
      }));
    } catch (error) {
      console.error("Error deleting task:", error);
      set({
        error:
          error instanceof Error ? error.message : "Error al eliminar la tarea",
      });
      throw error;
    }
  },

  deleteTasks: async (taskIds) => {
    try {
      const response = await fetch("/api/tasks/", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskIds),
      });

      if (!response.ok) {
        throw new Error("Error al eliminar las tareas");
      }

      // Remove the tasks from state
      set((state) => ({
        tasks: state.tasks.filter((task) => !taskIds.includes(task.id)),
      }));
    } catch (error) {
      console.error("Error deleting tasks:", error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "Error al eliminar las tareas",
      });
      throw error;
    }
  },

  updateTaskStatus: async (taskId, status) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar el estado de la tarea");
      }

      // Update the task status in the store
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId ? { ...task, status } : task
        ),
      }));
    } catch (error) {
      console.error("Error updating task status:", error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "Error al actualizar el estado de la tarea",
      });
      throw error;
    }
  },

  selectTask: (taskId) => {
    set({ selectedTaskId: taskId });
  },
});
