import { useState, useEffect } from "react";
import { api } from "~/lib/api";
import type { Sprint } from "~/types";

interface LastSprintTask {
  memberName: string;
  taskTitle: string;
  taskDescription: string;
  totalActualHours: number;
  totalEstimatedHours: number;
  taskStatus: string;
  sprintId: number;
}

interface DeveloperTasksData {
  tasks: LastSprintTask[];
  totalHours: number;
  totalTasks: number;
}

interface LastSprintData {
  sprint: Sprint | null;
  developerTasks: Record<string, DeveloperTasksData>;
  totalHours: number;
  totalTasks: number;
}

export function useLastSprint(sprintId?: string | number) {
  const [data, setData] = useState<LastSprintData>({
    sprint: null,
    developerTasks: {},
    totalHours: 0,
    totalTasks: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!sprintId) {
        setIsLoading(false);
        setError("No sprint selected");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Always fetch the specific sprint's data
        const endpoint = `/kpis/sprint/${sprintId}/tasks`;
        const response = await api.get<LastSprintTask[]>(endpoint);

        // Group tasks by developer
        const developerTasks: Record<string, DeveloperTasksData> = {};
        let totalHours = 0;
        let totalTasks = 0;

        response.forEach((task) => {
          if (!developerTasks[task.memberName]) {
            developerTasks[task.memberName] = {
              tasks: [],
              totalHours: 0,
              totalTasks: 0,
            };
          }

          developerTasks[task.memberName].tasks.push(task);
          developerTasks[task.memberName].totalHours +=
            task.totalActualHours || 0;
          developerTasks[task.memberName].totalTasks += 1;
          totalHours += task.totalActualHours || 0;
          totalTasks += 1;
        });

        // Sort tasks by title within each developer
        Object.values(developerTasks).forEach((devData) => {
          devData.tasks.sort((a, b) => a.taskTitle.localeCompare(b.taskTitle));
        });

        // Get the sprint info
        const sprint =
          response.length > 0
            ? await api.get<Sprint>(`/sprints/${sprintId}`)
            : null;

        setData({
          sprint,
          developerTasks,
          totalHours,
          totalTasks,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error fetching sprint data",
        );
        // Provide empty data on error
        setData({
          sprint: null,
          developerTasks: {},
          totalHours: 0,
          totalTasks: 0,
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [sprintId]); // Add sprintId to dependencies

  return {
    data,
    isLoading,
    error,
    loadingData: {
      sprint: null,
      developerTasks: {
        "Loading...": {
          tasks: [
            {
              memberName: "Cargando...",
              taskTitle: "Cargando...",
              taskDescription: "Cargando...",
              totalActualHours: 0,
              totalEstimatedHours: 0,
              taskStatus: "Cargando...",
              sprintId: 0,
            },
          ],
          totalHours: 0,
          totalTasks: 1,
        },
      },
      totalHours: 0,
      totalTasks: 0,
    },
  };
}
