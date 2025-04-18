import type { StateCreator } from "zustand";
import type { TaskStore, StoreState } from "~/store/types"; // Use 'import type'
import { api } from "~/lib/api"; // Assuming api helper exists

// Define KpiData structure (adjust path/definition if it exists elsewhere, e.g., ~/types)
export interface KpiData {
  memberName: string;
  completedTasks: number | null;
  totalAssignedTasks: number | null;
  completionRatePercent: number | null;
  totalActualHours: number | null;
  totalEstimatedHours: number | null;
}

// Define the state and actions for the productivity slice
export interface ProductivitySlice extends StoreState {
  kpiData: KpiData[];
  isLoadingKpi: boolean;
  fetchKpiData: (params: {
    teamId?: number;
    sprintId?: number;
  }) => Promise<void>;
}

export const createProductivitySlice: StateCreator<
  TaskStore,
  [],
  [],
  ProductivitySlice
> = (set, get) => ({
  kpiData: [],
  isLoadingKpi: false,
  error: null,

  fetchKpiData: async ({ teamId, sprintId }) => {
    set({ isLoadingKpi: true, error: null } as Partial<TaskStore>);
    try {
      let url = "/kpis/completion-rate"; // REMOVED leading /api
      const queryParams = new URLSearchParams();

      if (sprintId) {
        queryParams.append("sprintId", String(sprintId));
      } else if (teamId) {
        queryParams.append("teamId", String(teamId));
      }

      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      console.log(`Fetching KPI data from: ${url}`); // Log the relative path
      // api.get will prepend /api, resulting in /api/kpis/completion-rate?...
      const data = await api.get<KpiData[]>(url);
      console.log("KPI API Response:", data);

      set({ kpiData: data, isLoadingKpi: false } as Partial<TaskStore>);
    } catch (error: any) {
      console.error("Error fetching KPI data:", error);
      const errorMessage =
        error.response?.data?.message ||
        (error instanceof Error ? error.message : "Failed to fetch KPI data");
      set({
        error: errorMessage,
        isLoadingKpi: false,
        kpiData: [],
      } as Partial<TaskStore>);
    }
  },
});
