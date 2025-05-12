import type { StateCreator } from "zustand";
import type { TaskStore, StoreState } from "~/store/types";
import { api } from "~/lib/api";

export interface KpiData {
  memberName: string;
  teamName?: string; // Added for team context
  teamId?: number; // Added for team context
  sprintId?: number; // Added for sprint-level aggregation
  sprintName?: string; // Added for sprint-level aggregation
  completedTasks: number | null;
  totalAssignedTasks: number | null;
  completionRatePercent: number | null;
  totalActualHours: number | null;
  totalEstimatedHours: number | null;
}

export interface ProductivitySlice extends StoreState {
  kpiData: KpiData[];
  isLoadingKpi: boolean;
  statsViewMode: "member" | "sprint"; // Corrected: Renamed from "individual" | "team"
  toggleStatsViewMode: () => void;
  fetchKpiData: (params: {
    teamId?: number;
    sprintId?: number;
    isTeamView?: boolean; // Backend param for aggregation
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
  statsViewMode: "member", // Default to member view

  toggleStatsViewMode: () => {
    const currentViewMode = get().statsViewMode;
    set({
      statsViewMode: currentViewMode === "member" ? "sprint" : "member", // Toggle between member and sprint
    } as Partial<TaskStore>);
  },

  fetchKpiData: async ({ teamId, sprintId, isTeamView }) => {
    set({ isLoadingKpi: true, error: null, kpiData: [] } as Partial<TaskStore>); // Clear previous data
    try {
      let url = "/kpis/completion-rate";
      const queryParams = new URLSearchParams();

      // Add filters based on provided params
      if (sprintId) {
        queryParams.append("sprintId", String(sprintId));
      } else if (teamId) {
        queryParams.append("teamId", String(teamId));
      }

      // The 'isTeamView' param controls aggregation on the backend
      if (isTeamView) {
        queryParams.append("aggregated", "true");
      }

      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      console.log(`Fetching KPI data from: ${url}`);
      const data = await api.get<KpiData[]>(url);
      console.log("KPI API Response:", data);

      // Transform data if needed for sprint view
      let transformedData = data;
      if (isTeamView && teamId) {
        // For sprint view, ensure we have all sprints represented
        transformedData = data.map((item) => ({
          ...item,
          // Use memberName as sprintName for sprint view since the backend returns it this way
          sprintName: item.memberName,
          memberName: "Team", // Not used in sprint view
        }));
      } else if (!isTeamView && teamId) {
        // For developer view, ensure we have all necessary fields
        transformedData = data.map((item) => ({
          ...item,
          sprintName: item.sprintName || "Current Sprint",
          completedTasks: item.completedTasks || 0,
          totalAssignedTasks: item.totalAssignedTasks || 0,
          completionRatePercent: item.completionRatePercent || 0,
          totalActualHours: item.totalActualHours || 0,
          totalEstimatedHours: item.totalEstimatedHours || 0,
        }));
      }

      set({
        kpiData: transformedData,
        isLoadingKpi: false,
      } as Partial<TaskStore>);
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
