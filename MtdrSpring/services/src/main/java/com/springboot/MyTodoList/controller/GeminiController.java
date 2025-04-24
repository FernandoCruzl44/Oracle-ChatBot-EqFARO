package com.springboot.MyTodoList.controller;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import com.springboot.MyTodoList.MyTodoListApplication;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

class AtomizeRequest {
	private String taskDescription;

	public String getTaskDescription() {
		return taskDescription;
	}

	public void setTaskDescription(String taskDescription) {
		this.taskDescription = taskDescription;
	}
}

class TaskAnalysisRequest {
	private JSONArray tasks;
	private int numberOfSubtasks;
	private String additionalContext;

	public JSONArray getTasks() {
		return tasks;
	}

	public void setTasks(JSONArray tasks) {
		this.tasks = tasks;
	}

	public int getNumberOfSubtasks() {
		return numberOfSubtasks;
	}

	public void setNumberOfSubtasks(int numberOfSubtasks) {
		this.numberOfSubtasks = numberOfSubtasks;
	}

	public String getAdditionalContext() {
		return additionalContext;
	}

	public void setAdditionalContext(String additionalContext) {
		this.additionalContext = additionalContext;
	}
}

@RestController
@RequestMapping("/api/gemini")
public class GeminiController {

	private static final Logger logger = LoggerFactory.getLogger(MyTodoListApplication.class);
	private final String apiKey;

	public GeminiController(@Value("${gemini_api_key}") String geminiApiKey) {
		this.apiKey = geminiApiKey;
	}

	@PostMapping("/atomize")
	public String atomizeTask(@RequestBody AtomizeRequest request) {
		try {
			logger.info("Atomize request received: "
					+ request.getTaskDescription().substring(0, Math.min(100, request.getTaskDescription().length()))
					+ "...");

			// Enhanced prompt that explicitly requests JSON format
			String enhancedPrompt = "Por favor, divide la siguiente tarea en " +
					"subtareas más pequeñas y manejables. " +
					"NO des explicaciones o introducciones, SOLAMENTE debes responder con un array JSON válido. " +
					"Cada elemento del array debe tener una propiedad 'generated' que contenga: " +
					"title, tag (solo 'Feature' o 'Issue'), status, description, estimatedHours, startDate, endDate, " +
					"creatorName y assignees (array de strings con nombres). " +
					"Es CRÍTICO que tu respuesta sea ÚNICAMENTE un array JSON válido sin texto adicional.\n\n" +
					"Formato requerido exacto:\n" +
					"[\n" +
					"  {\n" +
					"    \"generated\": {\n" +
					"      \"title\": \"Título de la subtarea 1\",\n" +
					"      \"tag\": \"Feature\",\n" +
					"      \"status\": \"To Do\",\n" +
					"      \"description\": \"Descripción de la subtarea\",\n" +
					"      \"estimatedHours\": 4,\n" +
					"      \"startDate\": \"2025-04-10\",\n" +
					"      \"endDate\": \"2025-04-15\",\n" +
					"      \"creatorName\": \"Nombre del creador\",\n" +
					"      \"assignees\": [\"Nombre 1\", \"Nombre 2\"]\n" +
					"    }\n" +
					"  },\n" +
					"  {...}\n" +
					"]\n\n" +
					"Ahora, divide la siguiente tarea:\n" + request.getTaskDescription();

			String response = callGeminiAPI(enhancedPrompt);
			if (response == null) {
				throw new RuntimeException("Failed to get response from Gemini API");
			}

			logger.info("Response from Gemini API: " + response);

			// Clean up markdown code fences and validate JSON
			String cleanedResponse = cleanMarkdownResponse(response);

			try {
				// Attempt to parse as JSON array
				new JSONArray(cleanedResponse);
				return cleanedResponse;
			} catch (Exception e) {
				logger.error("Failed to parse response as JSON array: " + e.getMessage());

				// Fallback: Generate a basic JSON structure with subtasks based on the text
				// response
				return generateFallbackJson(response, request.getTaskDescription());
			}
		} catch (Exception e) {
			logger.error("Error in atomize endpoint: " + e.getMessage(), e);
			throw new RuntimeException("Error processing atomize request", e);
		}
	}

	private String generateFallbackJson(String response, String originalTask) {
		try {
			// Extract information from the text response
			// Parse for titles, descriptions, etc.
			JSONArray fallbackArray = new JSONArray();

			// Look for sections that might indicate subtasks
			String[] lines = response.split("\n");
			StringBuilder currentTitle = new StringBuilder();
			StringBuilder currentDescription = new StringBuilder();
			boolean inSubtask = false;
			int subtaskCount = 0;

			for (String line : lines) {
				String trimmedLine = line.trim();

				// Look for potential subtask titles
				if (trimmedLine.startsWith("**Subtarea") ||
						trimmedLine.startsWith("Subtarea") ||
						trimmedLine.startsWith("- ") ||
						trimmedLine.startsWith("* ") ||
						(trimmedLine.startsWith("Tarea") && !trimmedLine.contains("Principal"))) {

					// If we were already collecting a subtask, save it
					if (inSubtask && currentTitle.length() > 0) {
						JSONObject subtask = createSubtaskObject(
								currentTitle.toString(),
								currentDescription.toString(),
								originalTask);
						fallbackArray.put(new JSONObject().put("generated", subtask));
						subtaskCount++;
					}

					// Start collecting a new subtask
					currentTitle = new StringBuilder(trimmedLine.replaceAll("^[\\*\\-\\s]*", "")
							.replaceAll("^(?:\\*\\*)?Subtarea\\s*\\d*:?(?:\\*\\*)?\\s*", "")
							.replaceAll("^(?:\\*\\*)?Tarea\\s*\\d*\\.?\\d*:?(?:\\*\\*)?\\s*", ""));
					currentDescription = new StringBuilder();
					inSubtask = true;
				}
				// Add to description if we're in a subtask and it's not another header
				else if (inSubtask && !trimmedLine.startsWith("#") && !trimmedLine.isEmpty()) {
					// If the line looks like a description rather than metadata
					if (!trimmedLine.startsWith("**") && !trimmedLine.contains("Fecha de")) {
						currentDescription.append(trimmedLine).append(" ");
					}
				}
			}

			// Add the last subtask if we were collecting one
			if (inSubtask && currentTitle.length() > 0) {
				JSONObject subtask = createSubtaskObject(
						currentTitle.toString(),
						currentDescription.toString(),
						originalTask);
				fallbackArray.put(new JSONObject().put("generated", subtask));
				subtaskCount++;
			}

			// If no subtasks were found, create 3 generic ones
			if (subtaskCount == 0) {
				// Extract task name from the originalTask
				String taskName = "Tarea";
				if (originalTask.contains("title:")) {
					String[] parts = originalTask.split("title:");
					if (parts.length > 1) {
						taskName = parts[1].split("\n")[0].trim();
					}
				}

				// Create generic subtasks
				for (int i = 1; i <= 3; i++) {
					JSONObject subtask = createGenericSubtask(taskName, i);
					fallbackArray.put(new JSONObject().put("generated", subtask));
				}
			}

			return fallbackArray.toString();
		} catch (Exception e) {
			logger.error("Error generating fallback JSON: " + e.getMessage(), e);

			// Last resort - create a very basic structure
			try {
				JSONArray lastResortArray = new JSONArray();
				for (int i = 1; i <= 3; i++) {
					JSONObject subtask = new JSONObject();
					subtask.put("title", "Subtarea " + i);
					subtask.put("tag", "Feature");
					subtask.put("status", "To Do");
					subtask.put("description", "Parte " + i + " de la tarea original");
					subtask.put("estimatedHours", 4);
					subtask.put("startDate", "2025-04-10");
					subtask.put("endDate", "2025-04-15");
					subtask.put("creatorName", "Sistema");
					subtask.put("assignees", new JSONArray().put("Usuario"));

					lastResortArray.put(new JSONObject().put("generated", subtask));
				}
				return lastResortArray.toString();
			} catch (Exception ex) {
				// If all else fails, return a hardcoded valid JSON array
				return "[{\"generated\":{\"title\":\"Subtarea 1\",\"tag\":\"Feature\",\"status\":\"To Do\",\"description\":\"Parte 1\",\"estimatedHours\":4,\"startDate\":\"2025-04-10\",\"endDate\":\"2025-04-15\",\"creatorName\":\"Sistema\",\"assignees\":[\"Usuario\"]}}]";
			}
		}
	}

	private JSONObject createSubtaskObject(String title, String description, String originalTask) throws JSONException {
		JSONObject subtask = new JSONObject();

		// Extract dates and names from original task if possible
		String startDate = "2025-04-10";
		String endDate = "2025-04-15";
		String creatorName = "Sistema";
		JSONArray assignees = new JSONArray();

		// Try to extract values from original task
		if (originalTask != null) {
			if (originalTask.contains("startDate:")) {
				String[] parts = originalTask.split("startDate:");
				if (parts.length > 1) {
					startDate = parts[1].split("\n")[0].trim();
				}
			}

			if (originalTask.contains("endDate:")) {
				String[] parts = originalTask.split("endDate:");
				if (parts.length > 1) {
					String potentialEndDate = parts[1].split("\n")[0].trim();
					if (!potentialEndDate.equals("null") && !potentialEndDate.isEmpty()) {
						endDate = potentialEndDate;
					}
				}
			}

			if (originalTask.contains("creatorName:")) {
				String[] parts = originalTask.split("creatorName:");
				if (parts.length > 1) {
					creatorName = parts[1].split("\n")[0].trim();
				}
			}

			if (originalTask.contains("assignees:")) {
				String[] parts = originalTask.split("assignees:");
				if (parts.length > 1) {
					String assigneesStr = parts[1].split("\n")[0].trim();
					String[] assigneeList = assigneesStr.split(",");
					for (String assignee : assigneeList) {
						assignees.put(assignee.trim());
					}
				}
			}
		}

		// If no assignees were found, add a default one
		if (assignees.length() == 0) {
			assignees.put("Usuario");
		}

		subtask.put("title", title.trim());
		subtask.put("tag", "Feature");
		subtask.put("status", "To Do");
		subtask.put("description", description.toString().trim());
		subtask.put("estimatedHours", 4);
		subtask.put("startDate", startDate);
		subtask.put("endDate", endDate);
		subtask.put("creatorName", creatorName);
		subtask.put("assignees", assignees);

		return subtask;
	}

	private JSONObject createGenericSubtask(String taskName, int index) throws JSONException {
		JSONObject subtask = new JSONObject();

		String[] titles = {
				"Planificación y diseño",
				"Implementación y desarrollo",
				"Pruebas y validación",
				"Documentación y entrega"
		};

		String[] descriptions = {
				"Fase de análisis y planificación para establecer los requisitos y el diseño inicial.",
				"Desarrollo e implementación de las funcionalidades principales.",
				"Realización de pruebas exhaustivas para garantizar la calidad y corrección de errores.",
				"Creación de documentación y preparación para la entrega final."
		};

		subtask.put("title", (index <= titles.length ? titles[index - 1] : "Parte " + index) + " de " + taskName);
		subtask.put("tag", "Feature");
		subtask.put("status", "To Do");
		subtask.put("description",
				index <= descriptions.length ? descriptions[index - 1] : "Parte " + index + " de la tarea original");
		subtask.put("estimatedHours", 4);
		subtask.put("startDate", "2025-04-10");
		subtask.put("endDate", "2025-04-15");
		subtask.put("creatorName", "Sistema");
		subtask.put("assignees", new JSONArray().put("Usuario"));

		return subtask;
	}

	private String cleanMarkdownResponse(String response) {
		// Remove any markdown code fence markers
		String cleaned = response.trim()
				.replaceAll("^```\\w*\\s*", "") // Remove opening fence with optional language
				.replaceAll("\\s*```$", "") // Remove closing fence
				.trim();

		// If response already has a full JSON structure, just return it
		if (cleaned.startsWith("[") && cleaned.endsWith("]")) {
			return cleaned;
		}

		// Try to extract JSON from the response if not properly formatted
		int jsonStart = cleaned.indexOf("[");
		int jsonEnd = cleaned.lastIndexOf("]");

		if (jsonStart >= 0 && jsonEnd > jsonStart) {
			return cleaned.substring(jsonStart, jsonEnd + 1);
		}

		// If we can't extract JSON array, look for JSON object
		jsonStart = cleaned.indexOf("{");
		jsonEnd = cleaned.lastIndexOf("}");

		if (jsonStart >= 0 && jsonEnd > jsonStart) {
			// If we found a JSON object, wrap it in an array
			String jsonObject = cleaned.substring(jsonStart, jsonEnd + 1);
			return "[" + jsonObject + "]";
		}

		// Return the cleaned text - this will likely cause a parsing error,
		// but the caller can handle that and use a fallback
		return cleaned;
	}

	@PostMapping("/analyze-tasks")
	public String analyzeTasksForDivision(@RequestBody String requestBody) {
		try {
			JSONObject jsonRequest = new JSONObject(requestBody);
			JSONArray tasks = jsonRequest.getJSONArray("tasks");
			int numberOfSubtasks = jsonRequest.getInt("numberOfSubtasks");
			String additionalContext = jsonRequest.has("additionalContext") ? jsonRequest.getString("additionalContext")
					: "";

			// Format the tasks for Gemini with improved prompt
			StringBuilder prompt = new StringBuilder();
			prompt.append("Por favor, analiza las siguientes tareas y recomienda cuáles deberían dividirse en ")
					.append(numberOfSubtasks)
					.append(" subtareas basado en su complejidad, tamaño y estimación de horas. ")
					.append("DEBES RESPONDER ÚNICAMENTE CON UN OBJETO JSON VÁLIDO, sin texto adicional ni explicaciones. ");

			if (!additionalContext.isEmpty()) {
				prompt.append("Contexto adicional: ").append(additionalContext).append("\n\n");
			}

			prompt.append("Tareas a analizar:\n");

			for (int i = 0; i < tasks.length(); i++) {
				JSONObject task = tasks.getJSONObject(i);
				prompt.append(i + 1).append(". ID: ").append(task.getInt("id"))
						.append(", Título: ").append(task.getString("title"));

				if (task.has("description") && !task.isNull("description")) {
					prompt.append(", Descripción: ").append(task.getString("description"));
				}

				if (task.has("estimatedHours") && !task.isNull("estimatedHours")) {
					prompt.append(", Horas estimadas: ").append(task.getDouble("estimatedHours"));
				}

				prompt.append("\n");
			}

			prompt.append(
					"\nDevuelve EXACTAMENTE un objeto JSON con una propiedad 'recommendations' que contenga un array de objetos. ")
					.append("Cada objeto debe tener 'taskId', 'reason' (razón para dividir la tarea), y 'score' (puntuación de 1-10 ")
					.append("que indica lo adecuada que es la tarea para ser dividida). ")
					.append("Devuelve sólo las tareas con puntuación mayor a 5. Máximo 3 tareas recomendadas. ")
					.append("Es CRÍTICO que tu respuesta sea ÚNICAMENTE un objeto JSON válido sin ningún texto adicional.\n\n")
					.append("Formato EXACTO de respuesta:\n")
					.append("```json\n")
					.append("{\n")
					.append("  \"recommendations\": [\n")
					.append("    {\n")
					.append("      \"taskId\": 123,\n")
					.append("      \"reason\": \"Esta tarea es compleja porque...\",\n")
					.append("      \"score\": 8.5\n")
					.append("    }\n")
					.append("  ]\n")
					.append("}\n")
					.append("```\n");

			logger.info(
					"Analyze tasks prompt: " + prompt.toString().substring(0, Math.min(200, prompt.length())) + "...");

			String response = callGeminiAPI(prompt.toString());
			if (response == null) {
				throw new RuntimeException("Failed to get response from Gemini API");
			}

			logger.info("Response from Gemini API for analyze-tasks: " + response);

			// Clean up markdown code fences and try to extract JSON
			String cleanedResponse = cleanMarkdownResponse(response);
			logger.info("Cleaned response: " + cleanedResponse);

			// Try to parse as valid JSON object
			try {
				JSONObject jsonResponse = new JSONObject(cleanedResponse);
				// Check if it has the expected structure
				if (!jsonResponse.has("recommendations")) {
					// Add recommendations if missing
					jsonResponse.put("recommendations", new JSONArray());
				}
				return jsonResponse.toString();
			} catch (Exception e) {
				logger.error("Failed to parse response as JSON object: " + e.getMessage());

				// Try to see if it's a JSON array and if so, wrap it in an object
				try {
					JSONArray arrayResponse = new JSONArray(cleanedResponse);
					JSONObject wrappedResponse = new JSONObject();
					wrappedResponse.put("recommendations", arrayResponse);
					return wrappedResponse.toString();
				} catch (Exception e2) {
					logger.error("Failed to parse response as JSON array: " + e2.getMessage());

					// Generate a fallback response with task recommendations
					return generateFallbackRecommendations(tasks).toString();
				}
			}
		} catch (Exception e) {
			logger.error("Error in analyze-tasks endpoint: " + e.getMessage(), e);

			// Return a valid empty response in case of error
			JSONObject errorResponse = new JSONObject();
			errorResponse.put("recommendations", new JSONArray());
			errorResponse.put("error", "Error analyzing tasks: " + e.getMessage());
			return errorResponse.toString();
		}
	}

	private JSONObject generateFallbackRecommendations(JSONArray tasks) {
		try {
			JSONObject response = new JSONObject();
			JSONArray recommendations = new JSONArray();

			// Find up to 3 tasks that might be suitable for division based on length of
			// title/description
			// and estimated hours
			int count = 0;
			for (int i = 0; i < tasks.length() && count < 3; i++) {
				JSONObject task = tasks.getJSONObject(i);
				boolean isCandidate = false;
				String reason = "";

				// Check estimated hours
				if (task.has("estimatedHours") && !task.isNull("estimatedHours")) {
					double hours = task.getDouble("estimatedHours");
					if (hours > 8) {
						isCandidate = true;
						reason = "Esta tarea tiene una estimación de horas alta (" + hours
								+ "h), lo que indica que podría ser demasiado grande.";
					}
				}

				// Check title length
				if (!isCandidate && task.has("title")) {
					String title = task.getString("title");
					if (title.length() > 50) {
						isCandidate = true;
						reason = "El título de esta tarea es extenso y contiene múltiples conceptos que podrían separarse.";
					}
				}

				// Check description length
				if (!isCandidate && task.has("description") && !task.isNull("description")) {
					String description = task.getString("description");
					if (description.length() > 200) {
						isCandidate = true;
						reason = "La descripción detallada de esta tarea sugiere que contiene múltiples componentes que podrían trabajarse por separado.";
					}
				}

				if (isCandidate) {
					JSONObject recommendation = new JSONObject();
					recommendation.put("taskId", task.getInt("id"));
					recommendation.put("reason", reason);
					recommendation.put("score", 7.5);
					recommendations.put(recommendation);
					count++;
				}
			}

			response.put("recommendations", recommendations);
			return response;

		} catch (Exception e) {
			logger.error("Error generating fallback recommendations: " + e.getMessage());

			// Last resort - create a very basic valid response
			JSONObject response = new JSONObject();
			response.put("recommendations", new JSONArray());
			return response;
		}
	}

	// Gemini Methods
	public String callGeminiAPI(String prompt) {
		String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="
				+ apiKey;

		// Create request body in JSON format
		JSONObject requestBody = new JSONObject();
		JSONArray contents = new JSONArray();

		// Set up the message
		JSONObject message = new JSONObject();
		message.put("role", "user");

		JSONArray parts = new JSONArray();
		JSONObject textPart = new JSONObject();
		textPart.put("text", prompt);
		parts.put(textPart);

		message.put("parts", parts);
		contents.put(message);

		requestBody.put("contents", contents);

		try {
			// Create HTTP client
			HttpClient client = HttpClient.newBuilder()
					.connectTimeout(Duration.ofSeconds(30)) // Increased timeout for larger requests
					.build();

			// Create HTTP request
			HttpRequest request = HttpRequest.newBuilder()
					.uri(URI.create(url))
					.header("Content-Type", "application/json")
					.POST(HttpRequest.BodyPublishers.ofString(requestBody.toString(), StandardCharsets.UTF_8))
					.build();

			// Send request and receive response
			HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

			// Parse JSON response
			JSONObject jsonResponse = new JSONObject(response.body());

			if (jsonResponse.has("candidates") && jsonResponse.getJSONArray("candidates").length() > 0) {
				JSONObject candidate = jsonResponse.getJSONArray("candidates").getJSONObject(0);

				if (candidate.has("content") && candidate.getJSONObject("content").has("parts")) {
					JSONArray responseParts = candidate.getJSONObject("content").getJSONArray("parts");

					if (responseParts.length() > 0 && responseParts.getJSONObject(0).has("text")) {
						return responseParts.getJSONObject(0).getString("text");
					}
				}
			}

			logger.error("Could not extract text from response: " + jsonResponse.toString());
			return null;
		} catch (Exception e) {
			logger.error("Error calling Gemini API: " + e.getMessage(), e);
			return null;
		}
	}

	public String formatSubtasksForTelegram(String geminiResponse) {
		try {
			// Try to clean any markdown that might be in the response
			String cleanedResponse = geminiResponse.trim();
			if (cleanedResponse.startsWith("```json")) {
				cleanedResponse = cleanedResponse.substring("```json".length());
			} else if (cleanedResponse.startsWith("```")) {
				cleanedResponse = cleanedResponse.substring("```".length());
			}

			if (cleanedResponse.endsWith("```")) {
				cleanedResponse = cleanedResponse.substring(0, cleanedResponse.lastIndexOf("```"));
			}

			cleanedResponse = cleanedResponse.trim();

			// Create a formatted message for Telegram
			StringBuilder formattedMessage = new StringBuilder("🔄 Subtareas sugeridas:\n\n");

			// Try to parse as JSON
			JSONArray subtasksArray = new JSONArray(cleanedResponse);

			for (int i = 0; i < subtasksArray.length(); i++) {
				JSONObject subtask = subtasksArray.getJSONObject(i);
				JSONObject generated = subtask.getJSONObject("generated");
				formattedMessage.append("📌 Subtarea ").append(i + 1).append(":\n");
				formattedMessage.append("📝 Título: ").append(generated.getString("title")).append("\n");
				formattedMessage.append("🏷️ Tag: ").append(generated.getString("tag")).append("\n");
				formattedMessage.append("📊 Estado: ").append(generated.getString("status")).append("\n");
				formattedMessage.append("ℹ️ Descripción: ").append(generated.getString("description")).append("\n");
				formattedMessage.append("⏱️ Horas estimadas: ").append(generated.getDouble("estimatedHours"))
						.append("\n\n");
			}

			return formattedMessage.toString();

		} catch (Exception e) {
			logger.error("Error formatting Gemini response: " + e.getMessage(), e);
			return "Error processing suggested subtasks. Original response:\n\n" + geminiResponse;
		}
	}
}