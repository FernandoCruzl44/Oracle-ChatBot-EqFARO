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

// Helper function to map frontend Task to backend JSON payload
const mapTaskToBackend = (taskData: Partial<Task>): Record<string, any> => {
  const backendData: Record<string, any> = { ...taskData };

  // Map sprintId -> sprint_id
  if (backendData.hasOwnProperty("sprintId")) {
    backendData.sprint_id =
      backendData.sprintId === undefined ? null : backendData.sprintId;
    delete backendData.sprintId;
  }

  // Map teamId -> team_id
  if (backendData.hasOwnProperty("teamId")) {
    backendData.team_id = backendData.teamId;
    delete backendData.teamId;
  }

  // Map creatorId -> created_by_id (if needed by backend explicitly)
  if (backendData.hasOwnProperty("creatorId")) {
    backendData.created_by_id = backendData.creatorId;
    delete backendData.creatorId;
  }

  // Map estimatedHours -> estimated_hours
  if (backendData.hasOwnProperty("estimatedHours")) {
    backendData.estimated_hours = backendData.estimatedHours;
    delete backendData.estimatedHours;
  }

  // Map actualHours -> actual_hours
  if (backendData.hasOwnProperty("actualHours")) {
    backendData.actual_hours = backendData.actualHours;
    delete backendData.actualHours;
  }

  // Map assignees -> assignee_ids (if backend expects IDs)
  if (backendData.hasOwnProperty("assignees")) {
    // Assuming backend expects an array of IDs for creation/update
    backendData.assignee_ids = backendData.assignees?.map((a: any) => a.id);
    delete backendData.assignees;
  }

  // Remove fields backend doesn't expect/need
  delete backendData.creatorName;
  delete backendData.teamName;
  delete backendData.id; // Don't send id on create, usually not needed on update body either

  return backendData;
};

// Helper function to map backend response to frontend Task
const mapBackendToTask = (backendTask: Record<string, any>): Task => {
  const frontendTask: any = { ...backendTask };

  // Map sprint_id -> sprintId
  if (frontendTask.hasOwnProperty("sprint_id")) {
    frontendTask.sprintId = frontendTask.sprint_id;
    delete frontendTask.sprint_id;
  }

  // Map team_id -> teamId
  if (frontendTask.hasOwnProperty("team_id")) {
    frontendTask.teamId = frontendTask.team_id;
    delete frontendTask.team_id;
  }

  // Map created_by_id -> creatorId
  if (frontendTask.hasOwnProperty("created_by_id")) {
    frontendTask.creatorId = frontendTask.created_by_id;
    delete frontendTask.created_by_id;
  }

  // Map estimated_hours -> estimatedHours
  if (frontendTask.hasOwnProperty("estimated_hours")) {
    frontendTask.estimatedHours = frontendTask.estimated_hours;
    delete frontendTask.estimated_hours;
  }

  // Map actual_hours -> actualHours
  if (frontendTask.hasOwnProperty("actual_hours")) {
    frontendTask.actualHours = frontendTask.actual_hours;
    delete frontendTask.actual_hours;
  }

  // Ensure assignees is an array (backend might send it differently)
  if (!Array.isArray(frontendTask.assignees)) {
    frontendTask.assignees = frontendTask.assignees || [];
  }

  return frontendTask as Task;
};

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
    // ... (initializeData remains the same as previous version) ...
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

      // Fetch sprints during initialization as well
      const fetchSprints = fetch("/api/sprints").then((res) =>
        res.ok ? res.json() : []
      );

      const [tasksData, teams, users, sprints] = await Promise.all([
        fetchTasks,
        fetchTeams,
        fetchUsers,
        fetchSprints, // Fetch sprints
      ]);

      // Map backend tasks to frontend tasks
      const tasks = tasksData.map(mapBackendToTask);

      set({
        currentUser: userData,
        tasks,
        teams,
        users,
        sprints, // Set sprints in the store
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
    // ... (fetchTasks remains the same as previous version) ...
    const { currentUser, isLoadingTasks } = get();

    if (!currentUser || isLoadingTasks) return;

    set({ isLoadingTasks: true, error: null });

    let url = "/api/tasks/?";

    if (currentUser.role === "manager") {
      if (viewMode === "all") {
        url += "view_mode=all";
      } else {
        // Assuming teamId is passed correctly when viewMode is a team ID string
        url += `view_mode=team&team_id=${viewMode}`;
      }
    } else {
      if (viewMode === "all") {
        url += "view_mode=assigned"; // Show assigned tasks for non-managers 'all' view
      } else if (viewMode === "team") {
        url += "view_mode=team"; // Backend will use user's team ID
      }
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Error al cargar las tareas");
      }
      const data = await response.json();
      // Map backend response to frontend Task structure
      const tasks = data.map(mapBackendToTask);
      set({ tasks: tasks, isLoadingTasks: false });
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
    // Prepare data for backend, mapping names
    const backendTaskData = mapTaskToBackend({
      ...taskData,
      creatorId: currentUser?.id, // Ensure creatorId is set if backend needs it explicitly
    });

    try {
      const response = await fetch("/api/tasks/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backendTaskData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || errorData.detail || "Error al crear la tarea"
        );
      }

      const createdBackendTask = await response.json();
      // Map response back to frontend Task structure
      const newTask = mapBackendToTask(createdBackendTask);

      // Ensure creatorName is present
      if (!newTask.creatorName && currentUser) {
        newTask.creatorName = currentUser.name;
      }

      set((state) => ({
        tasks: [...state.tasks, newTask], // Add the correctly mapped task
      }));

      return newTask;
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
    // Prepare data for backend, mapping names
    const backendTaskData = mapTaskToBackend(taskData);

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backendTaskData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            errorData.detail ||
            "Error al actualizar la tarea"
        );
      }

      const updatedBackendTask = await response.json();
      // Map response back to frontend Task structure
      const updatedTask = mapBackendToTask(updatedBackendTask);

      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId
            ? { ...task, ...updatedTask } // Overwrite existing task with FULL updated task from response
            : task
        ),
      }));

      return updatedTask; // Return the mapped task
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
    // ... (deleteTask remains the same) ...
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || errorData.detail || "Error al eliminar la tarea"
        );
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
    // ... (deleteTasks remains the same) ...
    try {
      const response = await fetch("/api/tasks/", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskIds),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            errorData.detail ||
            "Error al eliminar las tareas"
        );
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
    // ... (updateTaskStatus remains the same, but uses mapping for response) ...
    try {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            errorData.detail ||
            "Error al actualizar el estado de la tarea"
        );
      }

      // Get the full updated task from the response
      const updatedBackendTask = await response.json();
      const updatedTask = mapBackendToTask(updatedBackendTask);

      set((state) => ({
        tasks: state.tasks.map(
          (task) => (task.id === taskId ? { ...task, ...updatedTask } : task) // Use FULL response data
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
