// app/store/index.ts
import { create } from "zustand";
import { createTaskSlice } from "./slices/taskSlice";
import { createUserSlice } from "./slices/userSlice";
import { createTeamSlice } from "./slices/teamSlice";
import { createCommentSlice } from "./slices/commentSlice";
import type { TaskStore } from "./types";

const useTaskStore = create<TaskStore>((...args) => ({
  ...createTaskSlice(...args),
  ...createUserSlice(...args),
  ...createTeamSlice(...args),
  ...createCommentSlice(...args),
}));

export default useTaskStore;
