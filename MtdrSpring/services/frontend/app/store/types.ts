// app/store/types.ts
import type { TaskSlice } from "~/store/slices/taskSlice";
import type { CommentSlice } from "./slices/commentSlice";
import type { TeamSlice } from "./slices/teamSlice";
import type { UserSlice } from "./slices/userSlice";

export interface StoreState {
  error: string | null;
}

export type TaskStore = TaskSlice & UserSlice & TeamSlice & CommentSlice;
