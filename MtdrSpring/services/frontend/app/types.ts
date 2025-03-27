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

  // Creator information
  creatorId?: number;
  creatorName?: string;

  // Team information
  teamId?: number;
  teamName?: string;

  // Assignees as User objects
  assignees?: User[];
}

export interface Team {
  id: number;
  name: string;
  description?: string;
}
