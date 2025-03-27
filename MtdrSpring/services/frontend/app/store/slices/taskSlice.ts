// app/store/slices/taskSlice.ts
import type { StateCreator } from "zustand";
import type { TaskStore, StoreState } from "~/store/types";
import type { Task } from "~/types";

export interface TaskSlice extends StoreState {
  tasks: Task[];
  isLoadingTasks: boolean;
  isInitialized: boolean;
  selectedTaskId: number | null;

  getTaskById: (id: number) => Task | undefined;

  initializeData: () => Promise<void>;

  fetchTasks: (viewMode: string, teamId?: string) => Promise<void>;
  createTask: (taskData: Partial<Task>) => Promise<Task>;
  updateTask: (taskId: number, taskData: Partial<Task>) => Promise<Task>;
  deleteTask: (taskId: number) => Promise<void>;
  deleteTasks: (taskIds: number[]) => Promise<void>;
  updateTaskStatus: (taskId: number, status: string) => Promise<void>;
  selectTask: (taskId: number | null) => void;
}

export const createTaskSlice: StateCreator<TaskStore, [], [], TaskSlice> = (
  set,
  get
) => ({
  tasks: [],
  isLoadingTasks: false,
  isInitialized: false,
  error: null,
  selectedTaskId: null,

  getTaskById: (id) => {
    return get().tasks.find((task: Task) => task.id === id);
  },

  initializeData: async () => {
    if (get().isInitialized || get().isLoadingTasks) return;

    set({ error: null, isLoadingTasks: true });

    try {
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

      let tasksUrl = "/api/tasks/?view_mode=";
      tasksUrl += userData.role === "manager" ? "all" : "assigned";

      const fetchTasks = fetch(tasksUrl).then((res) =>
        res.ok ? res.json() : []
      );

      const fetchTeams =
        userData.role === "manager"
          ? fetch("/api/teams/").then((res) => (res.ok ? res.json() : []))
          : Promise.resolve([]);

      const fetchUsers = fetch("/api/users/").then((res) =>
        res.ok ? res.json() : []
      );

      const [tasks, teams, users] = await Promise.all([
        fetchTasks,
        fetchTeams,
        fetchUsers,
      ]);

      set({
        currentUser: userData,
        tasks,
        teams,
        users,
        isLoadingTasks: false,
        isInitialized: true,
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

  fetchTasks: async (viewMode, teamId) => {
    const { currentUser, isLoadingTasks } = get();

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

      const processedTask = {
        ...createdTask,
        created_by:
          createdTask.created_by ||
          createdTask.creator?.name ||
          currentUser?.name ||
          "Usuario",
      };

      set((state: { tasks: Task[] }) => ({
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

      set((state: { tasks: Task[] }) => ({
        tasks: state.tasks.map((task: Task) =>
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

      set((state: { tasks: Task[] }) => ({
        tasks: state.tasks.filter((task: Task) => task.id !== taskId),
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

      set((state: { tasks: Task[] }) => ({
        tasks: state.tasks.filter((task: Task) => !taskIds.includes(task.id)),
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

      set((state: { tasks: Task[] }) => ({
        tasks: state.tasks.map((task: Task) =>
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
