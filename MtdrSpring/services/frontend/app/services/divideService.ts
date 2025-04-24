import type { Task } from "~/types";
import { api } from "~/lib/api";

interface DivisionResponse {
  generated: {
    title: string;
    tag: "Feature" | "Issue";
    status: string;
    description?: string;
    estimatedHours?: number;
    startDate: string;
    endDate?: string;
    creatorName: string;
    assignees: string[]; // Changed to match actual API response
  };
}

export async function getDividedTasks(
  task: Task,
  numberOfSubtasks: number = 3,
  additionalContext: string = "",
): Promise<Task[]> {
  try {
    const taskDescription = `Tarea a dividir en ${numberOfSubtasks} subtareas:\n${task.title}: ${
      task.description || ""
    }${additionalContext ? `\nContexto adicional: ${additionalContext}` : ""}
    \nDatos dados: \ncreatorName: ${task.creatorName}\n status: ${
      task.status
    }\n startDate: ${task.startDate}\n endDate: ${task.endDate}\nassignees: ${task.assignees?.map((a) => a.name).join(", ") || "ninguno"}`;

    // We're still using the same endpoint even though we renamed our function
    const data = await api.post<DivisionResponse[]>("/gemini/atomize", {
      taskDescription,
    });

    return data.map((item) => {
      // Create assignee objects from strings, maintaining existing IDs where possible
      const assignees = item.generated.assignees.map((assigneeName) => {
        // Try to find matching assignee from original task
        const existingAssignee = task.assignees?.find(
          (a) => a.name === assigneeName,
        );
        return (
          existingAssignee || {
            id: Math.floor(Math.random() * 10000), // Temporary ID if no match
            name: assigneeName,
          }
        );
      });

      return {
        id: Math.floor(Math.random() * 10000),
        title: item.generated.title,
        tag: (item.generated.tag.charAt(0).toUpperCase() +
          item.generated.tag.slice(1)) as "Feature" | "Issue", // Capitalize tag
        status: item.generated.status || task.status,
        description: item.generated.description,
        estimatedHours: item.generated.estimatedHours,
        startDate: item.generated.startDate || task.startDate,
        endDate: item.generated.endDate || task.endDate || null,
        creatorName: item.generated.creatorName || task.creatorName,
        assignees,
        actualHours: 0,
        sprintId: task.sprintId,
        teamName: task.teamName,
      };
    });
  } catch (error) {
    console.error("Error dividing tasks:", error);
    throw error;
  }
}
