// app/types/Task.ts
export interface User {
  id: number;
  name: string;
  email?: string;
  role?: string;
  teamId?: number;
  teamName?: string;
}

export interface Comment {
  id: number;
  taskId: number;
  content: string;
  creatorId: number;
  creatorName: string;
  createdAt: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  tag: "Feature" | "Issue";
  status: string;
  startDate: string;
  endDate: string | null;
  sprintId?: number | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
  creatorId?: number;
  creatorName?: string;
  teamId?: number;
  teamName?: string;
  assignees?: User[];
}

export interface Team {
  id: number;
  name: string;
  description?: string;
}

export interface Sprint {
  id: number;
  teamId: number;
  teamName: string;
  name: string;
  status: "PLANNED" | "ACTIVE" | "COMPLETED" | "CANCELED";
  startDate: string;
  endDate: string;
  tasksCount?: number;
  completedTasksCount?: number;
}
