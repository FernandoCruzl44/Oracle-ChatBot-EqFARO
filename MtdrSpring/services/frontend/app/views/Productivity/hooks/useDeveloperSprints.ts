import { useState, useEffect } from "react";
import { api } from "~/lib/api";

interface DeveloperSprintData {
  memberName: string;
  sprintName: string;
  totalActualHours?: number;
  completedTasks?: number;
}

interface SprintData {
  hours: number;
  tasks: number;
}

interface ProcessedDeveloperData {
  sprintName: string;
  totalTasks: number;
  memberTasks: {
    [key: string]: number; // key is developer name, value is number of tasks
  };
}

export function useDeveloperSprints(teamId: string | number) {
  const [data, setData] = useState<ProcessedDeveloperData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch tasks data only since we're showing tasks completed
        const tasksResponse = await api.get<DeveloperSprintData[]>(
          `/kpis/developer-performance/tasks${
            teamId !== "all" ? `?teamId=${teamId}` : ""
          }`,
        );

        // Process and combine the data
        const sprintMap = new Map<string, ProcessedDeveloperData>();

        // First pass: Initialize sprint data
        tasksResponse.forEach((item) => {
          if (!sprintMap.has(item.sprintName)) {
            sprintMap.set(item.sprintName, {
              sprintName: item.sprintName,
              totalTasks: 0,
              memberTasks: {},
            });
          }
        });

        // Second pass: Fill in task data
        tasksResponse.forEach((item) => {
          const sprintData = sprintMap.get(item.sprintName)!;
          const tasks = item.completedTasks || 0;

          sprintData.memberTasks[item.memberName] = tasks;
          sprintData.totalTasks += tasks;
        });

        // Sort sprints by name
        const sortedData = Array.from(sprintMap.values()).sort((a, b) =>
          a.sprintName.localeCompare(b.sprintName),
        );

        setData(sortedData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Error fetching developer performance data",
        );
        setData([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [teamId]);

  return {
    data,
    isLoading,
    error,
    loadingData: [
      {
        sprintName: "Cargando...",
        totalTasks: 0,
        memberTasks: {},
      },
    ],
  };
}
