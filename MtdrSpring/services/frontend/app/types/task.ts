// app/types/task.ts
export interface Task {
  id: number;
  title: string;
  tag: "Feature" | "Issue";
  status: string;
  startDate: string;
  endDate: string | null;
  created_by: string;
  createdBy?: string;
  description?: string;
  team?: string;
  assignees?: string[];
}
