// app/store/index.ts (updated)
import { create } from "zustand";
import { createTaskSlice } from "./slices/taskSlice";
import { createUserSlice } from "./slices/userSlice";
import { createTeamSlice } from "./slices/teamSlice";
import { createCommentSlice } from "./slices/commentSlice";
import { createSprintSlice } from "./slices/sprintSlice";
import { createPreferencesSlice } from "./slices/preferencesSlice";
import { createAuthSlice } from "./slices/authSlice";
import { createProductivitySlice } from "./slices/productivitySlice";
import type { TaskStore } from "./types";

const useTaskStore = create<TaskStore>((...args) => ({
  ...createTaskSlice(...args),
  ...createUserSlice(...args),
  ...createTeamSlice(...args),
  ...createCommentSlice(...args),
  ...createSprintSlice(...args),
  ...createPreferencesSlice(...args),
  ...createAuthSlice(...args),
  ...createProductivitySlice(...args),
}));

export default useTaskStore;
