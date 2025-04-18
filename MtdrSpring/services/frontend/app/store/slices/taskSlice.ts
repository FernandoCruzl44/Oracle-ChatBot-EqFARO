// app/store/slices/taskSlice.ts
import type { StateCreator } from "zustand";
import type { TaskStore, StoreState } from "~/store/types";
import type { Task } from "~/types";
import { api } from "~/lib/api";

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
  updateTaskStatus: (
    taskId: number,
    status: string,
    taskData: Partial<Task>,
  ) => Promise<void>;
  selectTask: (taskId: number | null) => void;

  migrateTasksToSprint: (
    targetSprintId: number,
    taskIds: number[],
  ) => Promise<void>;
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

  // if (backendData.hasOwnProperty("endDate")) {
  //   backendData.end_date = backendData.endDate;
  //   delete backendData.endDate;
  // }

  // Map assignees -> assignee_ids (if backend expects IDs)
  if (backendData.hasOwnProperty("assignees")) {
    // Assuming backend expects an array of IDs for creation/update
    backendData.assignee_ids = backendData.assignees?.map((a: any) => a.id);
    delete backendData.assignees;
  }

  // Already has assignee_ids, no need to map
  if (
    !backendData.hasOwnProperty("assignee_ids") &&
    backendData.hasOwnProperty("assignees")
  ) {
    backendData.assignee_ids = backendData.assignees?.map((a: any) => a.id);
  }

  // Remove fields backend doesn't expect/need
  delete backendData.creatorName;
  delete backendData.teamName;
  delete backendData.id; // Don't send id on create, usually not needed on update body either
  delete backendData.assignees; // Ensure assignees is removed since we're using assignee_ids

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

  // if (frontendTask.hasOwnProperty("end_date")) {
  //   frontendTask.endDate = frontendTask.end_date;
  //   delete frontendTask.end_date;
  // }

  // Ensure assignees is an array (backend might send it differently)
  if (!Array.isArray(frontendTask.assignees)) {
    frontendTask.assignees = frontendTask.assignees || [];
  }

  return frontendTask as Task;
};

export const createTaskSlice: StateCreator<TaskStore, [], [], TaskSlice> = (
  set,
  get,
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

    // Keep isLoadingTasks true initially to prevent the TaskView effect from running too early
    set({ error: null, isLoadingTasks: true });

    try {
      const userData = await api.get("/identity/current");

      if (userData.message === "No identity set") {
        set({
          error:
            "No has seleccionado un usuario. Por favor selecciona un usuario para ver las tareas.",
          isLoadingTasks: false, // Set loading false here as we stop
        });
        return;
      }

      // Removed initial viewMode determination as TaskView's effect handles it

      // Fetch teams, users, and sprints, but NOT tasks here
      const fetchTeams =
        userData.role === "manager" ? api.get("/teams/") : Promise.resolve([]);
      const fetchUsers = api.get("/users/");
      const fetchSprints = api.get("/sprints/"); // Fetch all sprints initially

      // Wait for user-related data and sprints
      const [teams, users, sprints] = await Promise.all([
        fetchTeams,
        fetchUsers,
        fetchSprints,
      ]);

      // Don't set tasks here, TaskView's effect will fetch them
      set({
        currentUser: userData,
        // tasks: [], // Initialize tasks as empty or keep existing if needed
        teams,
        users,
        sprints,
        isLoadingTasks: false, // Set loading false AFTER setting user/teams/sprints
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
    const { currentUser } = get(); // Removed isLoadingTasks check here

    // Only proceed if currentUser is available
    if (!currentUser) {
      console.warn("fetchTasks called before currentUser is initialized.");
      return;
    }

    set({ isLoadingTasks: true, error: null });

    let url = "/tasks/?";

    // Logic to determine URL based on viewMode and user role remains the same
    if (currentUser.role === "manager") {
      if (viewMode === "all") {
        url += "view_mode=all";
      } else {
        // Assuming viewMode is a team ID string when not 'all'
        url += `view_mode=team&team_id=${viewMode}`;
      }
    } else {
      // Non-manager logic
      if (viewMode === "all") {
        // For non-managers, 'all' might mean 'assigned' or 'team' depending on requirements
        // Let's assume 'assigned' for now if they don't belong to a specific team view
        url += "view_mode=assigned";
        // If non-managers should see their team's tasks by default on 'all', adjust here
        // url += `view_mode=team`; // Backend needs to handle this case based on user's team
      } else if (viewMode === "team") {
        // Explicitly viewing their own team
        url += "view_mode=team"; // Backend will use user's team ID
      } else {
        // Fallback or handle other potential viewModes for non-managers if any
        url += "view_mode=assigned"; // Default to assigned if viewMode is unexpected
      }
    }

    try {
      const data = await api.get(url);
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
      const createdBackendTask = await api.post("/tasks/", backendTaskData);
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
    const { currentUser } = get();
    if (!currentUser) throw new Error("Usuario no autenticado");

    const backendData = mapTaskToBackend(taskData);

    try {
      const updatedBackendTask = await api.put(`/tasks/${taskId}`, backendData);
      const updatedTask = mapBackendToTask(updatedBackendTask);
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId ? { ...task, ...updatedTask } : task,
        ),
      }));
      return updatedTask;
    } catch (error) {
      console.error(`Error updating task ${taskId}:`, error);
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
      await api.delete(`/tasks/${taskId}`);
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== taskId),
      }));
    } catch (error) {
      console.error(`Error deleting task ${taskId}:`, error);
      set({
        error:
          error instanceof Error ? error.message : "Error al eliminar la tarea",
      });
      throw error;
    }
  },

  deleteTasks: async (taskIds) => {
    try {
      await api.post("/tasks/delete-multiple", taskIds);
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

  updateTaskStatus: async (taskId, status, taskData) => {
    try {
      // Add the current date as endDate when task is marked as completed
      let updatedTaskData = { ...taskData, status };

      if (status === "Completada" && !updatedTaskData.endDate) {
        // Set endDate to current date in local timezone when task is completed
        const now = new Date();
        const localDate = new Date(
          now.getTime() - now.getTimezoneOffset() * 60000,
        )
          .toISOString()
          .split("T")[0];
        updatedTaskData.endDate = localDate;
      } else if (status !== "Completada") {
        // Optionally clear endDate if setting back to an incomplete status
        // Uncomment this if you want to clear the end date when a task is moved back to an incomplete status
        // updatedTaskData.endDate = null;
      }

      // Map to backend format
      const backendData = mapTaskToBackend(updatedTaskData);
      const updatedBackendTask = await api.put(`/tasks/${taskId}`, backendData);
      const updatedTask = mapBackendToTask(updatedBackendTask);

      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId ? { ...task, ...updatedTask } : task,
        ),
      }));
    } catch (error) {
      console.error(`Error updating status for task ${taskId}:`, error);
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

  migrateTasksToSprint: async (targetSprintId, taskIds) => {
    set({ error: null }); // Clear previous errors
    try {
      // Backend expects 'targetSprintId' and 'taskIds'
      const payload = {
        targetSprintId,
        taskIds,
      };
      await api.post("/tasks/migrate-sprint", payload);

      // Update local state
      set((state) => ({
        tasks: state.tasks.map((task) =>
          taskIds.includes(task.id)
            ? { ...task, sprintId: targetSprintId } // Update sprintId for migrated tasks
            : task,
        ),
      }));
    } catch (error) {
      console.error("Error migrating tasks:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error al migrar las tareas";
      set({ error: errorMessage });
      throw new Error(errorMessage); // Re-throw for the component to catch
    }
  },
});
