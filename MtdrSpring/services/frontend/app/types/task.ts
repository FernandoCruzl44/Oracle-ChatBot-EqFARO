// app/constants/mockData.ts
export interface Task {
  id: number;
  title: string;
  tag: "Feature" | "Issue";
  status: string;
  startDate: string;
  endDate: string | null;
  createdBy: string;
}
