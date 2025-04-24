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

interface TaskAnalysisRequest {
  tasks: Array<{
    id: number;
    title: string;
    description?: string;
    estimatedHours?: number | null;
    status: string;
    tag: string;
  }>;
  numberOfSubtasks: number;
  additionalContext?: string;
}

export interface TaskRecommendation {
  taskId: number;
  reason: string;
  score: number;
}

export interface TaskAnalysisResponse {
  recommendations: TaskRecommendation[];
}

/**
 * Analyzes tasks to determine which ones are good candidates for division
 */
export async function analyzeTasksForDivision(
  tasks: Task[],
  numberOfSubtasks: number,
  additionalContext?: string,
): Promise<TaskAnalysisResponse> {
  try {
    const payload: TaskAnalysisRequest = {
      tasks: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description || "",
        estimatedHours: task.estimatedHours,
        status: task.status,
        tag: task.tag,
      })),
      numberOfSubtasks,
      additionalContext,
    };

    // Call the Gemini API endpoint for task analysis
    const response = await api.post<TaskAnalysisResponse>(
      "/gemini/analyze-tasks",
      payload,
    );
    return response;
  } catch (error) {
    console.error("Error analyzing tasks for division:", error);

    // Fallback implementation if the API fails
    const backlogTasks = tasks.filter(
      (task) => task.status === "Backlog" || task.status === "To Do",
    );

    // Simple scoring based on title length and estimated hours
    const recommendations = backlogTasks
      .map((task) => {
        const titleComplexity = task.title.length / 10;
        const hoursFactor =
          (task.estimatedHours || 0) > 8
            ? 5
            : (task.estimatedHours || 0) > 4
              ? 3
              : 1;
        const score = titleComplexity * hoursFactor;

        let reason = "";
        if ((task.estimatedHours || 0) > 8) {
          reason = `Esta tarea tiene una estimación de horas alta (${task.estimatedHours}h), lo que indica que podría ser demasiado grande.`;
        } else if (task.title.length > 50) {
          reason =
            "El título de esta tarea es extenso y contiene múltiples conceptos que podrían separarse.";
        } else {
          reason =
            "Esta tarea parece contener varios componentes que podrían dividirse para mejor seguimiento.";
        }

        return {
          taskId: task.id,
          reason,
          score,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return { recommendations };
  }
}

/**
 * Divides a task into smaller subtasks using AI
 */
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

    // Using the same endpoint as before, but with a better name in our code
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
