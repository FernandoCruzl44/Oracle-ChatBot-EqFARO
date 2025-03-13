// app/store/types.ts (Updated)
import type { Task, User, Team, Comment } from "~/types";

// Base state that will be shared across all slices
export interface StoreState {
  // UI state
  error: string | null;
}

// Task slice state and actions
export interface TaskSlice extends StoreState {
  tasks: Task[];
  isLoadingTasks: boolean;
  isInitialized: boolean; // New flag to track initialization status
  selectedTaskId: number | null;

  // Getters
  getTaskById: (id: number) => Task | undefined;

  // Initialize all data at once - NEW
  initializeData: () => Promise<void>;

  // Actions
  fetchTasks: (viewMode: string, teamId?: string) => Promise<void>;
  createTask: (taskData: Partial<Task>) => Promise<Task>;
  updateTask: (taskId: number, taskData: Partial<Task>) => Promise<Task>;
  deleteTask: (taskId: number) => Promise<void>;
  deleteTasks: (taskIds: number[]) => Promise<void>;
  updateTaskStatus: (taskId: number, status: string) => Promise<void>;
  selectTask: (taskId: number | null) => void;
}

// User slice state and actions
export interface UserSlice extends StoreState {
  users: User[];
  currentUser: User | null;
  isLoadingUsers: boolean;

  // Actions - moved to initializeData in TaskSlice
  fetchCurrentUser: () => Promise<void>;
  fetchUsers: () => Promise<void>;
}

// Team slice state and actions
export interface TeamSlice extends StoreState {
  teams: Team[];
  isLoadingTeams: boolean;

  // Actions - moved to initializeData in TaskSlice
  fetchTeams: () => Promise<void>;
}

// Comment slice state and actions
export interface CommentSlice extends StoreState {
  comments: Record<number, Comment[]>; // taskId -> comments
  loading: boolean; // Add loading state property

  // Getters
  getTaskComments: (taskId: number) => Comment[];
  isLoadingComments: () => boolean; // Add getter for loading state

  // Actions
  fetchComments: (taskId: number) => Promise<void>;
  addComment: (taskId: number, content: string) => Promise<void>;
  deleteComment: (commentId: number, taskId: number) => Promise<void>;
}

// Complete store type combining all slices
export type TaskStore = TaskSlice & UserSlice & TeamSlice & CommentSlice;
