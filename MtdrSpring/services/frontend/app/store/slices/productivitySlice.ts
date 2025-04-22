import type { StateCreator } from "zustand";
import type { TaskStore, StoreState } from "~/store/types";
import { api } from "~/lib/api";

export interface KpiData {
  memberName: string;
  completedTasks: number | null;
  totalAssignedTasks: number | null;
  completionRatePercent: number | null;
  totalActualHours: number | null;
  totalEstimatedHours: number | null;
}

export interface ProductivitySlice extends StoreState {
  kpiData: KpiData[];
  isLoadingKpi: boolean;
  statsViewMode: "individual" | "team";
  toggleStatsViewMode: () => void;
  fetchKpiData: (params: {
    teamId?: number;
    sprintId?: number;
    isTeamView?: boolean;
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
  statsViewMode: "individual",

  toggleStatsViewMode: () => {
    const currentViewMode = get().statsViewMode;
    set({
      statsViewMode: currentViewMode === "individual" ? "team" : "individual",
    } as Partial<TaskStore>);
  },

  fetchKpiData: async ({ teamId, sprintId, isTeamView }) => {
    set({ isLoadingKpi: true, error: null } as Partial<TaskStore>);
    try {
      let url = "/kpis/completion-rate";
      const queryParams = new URLSearchParams();

      if (sprintId) {
        queryParams.append("sprintId", String(sprintId));
      } else if (teamId) {
        queryParams.append("teamId", String(teamId));
      }

      if (isTeamView || get().statsViewMode === "team") {
        queryParams.append("aggregated", "true");
      }

      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      console.log(`Fetching KPI data from: ${url}`);
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
