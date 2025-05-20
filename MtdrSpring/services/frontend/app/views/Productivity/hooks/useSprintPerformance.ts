import { useState, useEffect } from "react";
import { api } from "~/lib/api";

interface SprintPerformanceData {
  sprintName: string;
  memberName: string;
  totalActualHours: number;
}

interface ProcessedSprintData {
  sprintName: string;
  totalHours: number;
  memberHours: {
    [key: string]: number;
  };
}

export function useSprintPerformance(teamId: string | number) {
  const [data, setData] = useState<ProcessedSprintData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.get<SprintPerformanceData[]>(
          `/kpis/sprint-performance/hours${
            teamId !== "all" ? `?teamId=${teamId}` : ""
          }`,
        );

        const sprintMap = new Map<string, ProcessedSprintData>();

        response.forEach((item) => {
          if (!sprintMap.has(item.sprintName)) {
            sprintMap.set(item.sprintName, {
              sprintName: item.sprintName,
              totalHours: 0,
              memberHours: {},
            });
          }

          const sprintData = sprintMap.get(item.sprintName)!;
          sprintData.totalHours += item.totalActualHours;
          sprintData.memberHours[item.memberName] = item.totalActualHours;
        });

        const sortedData = Array.from(sprintMap.values()).sort((a, b) =>
          a.sprintName.localeCompare(b.sprintName),
        );

        setData(sortedData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Error fetching sprint performance data",
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
        totalHours: 0,
        memberHours: {},
      },
    ],
  };
}
