// app/store/index.ts
import { create } from "zustand";
import { createTaskSlice } from "./slices/taskSlice";
import { createUserSlice } from "./slices/userSlice";
import { createTeamSlice } from "./slices/teamSlice";
import { createCommentSlice } from "./slices/commentSlice";
import type { TaskStore } from "./types";

// Create the store with all slices combined
const useTaskStore = create<TaskStore>((...args) => ({
  // Initialize with a single loading state
  ...createTaskSlice(...args),
  ...createUserSlice(...args),
  ...createTeamSlice(...args),
  ...createCommentSlice(...args),
}));

export default useTaskStore;
