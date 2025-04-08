// app/store/types.ts (updated)
import type { TaskSlice } from "~/store/slices/taskSlice";
import type { CommentSlice } from "./slices/commentSlice";
import type { TeamSlice } from "./slices/teamSlice";
import type { UserSlice } from "./slices/userSlice";
import type { SprintSlice } from "./slices/sprintSlice";
import type { PreferencesSlice } from "./slices/preferencesSlice";
import type { AuthSlice } from "./slices/authSlice";

export interface StoreState {
  error: string | null;
}

export type TaskStore = TaskSlice &
  UserSlice &
  TeamSlice &
  CommentSlice &
  SprintSlice &
  PreferencesSlice &
  AuthSlice;
