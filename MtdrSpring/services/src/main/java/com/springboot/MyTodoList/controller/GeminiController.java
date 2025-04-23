
package com.springboot.MyTodoList.controller;
import java.util.List;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.springboot.MyTodoList.model.Task;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.springboot.MyTodoList.MyTodoListApplication;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@RestController
@RequestMapping("/api/ai")
public class GeminiController {
    
	private static final Logger logger = LoggerFactory.getLogger(MyTodoListApplication.class);
	private final String apiKey;
	//@Value("${gemini.api.key}") String apiKey;
    
	public GeminiController(@Value("${gemini_api_key}") String geminiApiKey) {
		this.apiKey =geminiApiKey;
	}


	@GetMapping("/atomize")
	public ResponseEntity<?> getTaskAtomizedByTaskId(@RequestBody Task task) {
		String response = callGeminiToAtomize(descriptionFromTask(task));
		if (response == null) {
			return ResponseEntity.internalServerError()
				.body("{\"msg\": \"Error atomizando con Gemini\"}");
		}
		return ResponseEntity.status(HttpStatus.OK).body(response);
	}

	public static String descriptionFromTask(Task task)	{
		return "Tarea a dividir:\n"+ task.getTitle() + ": " + task.getDescription() + "\nDatos dados: \ncreatorName: " + task.getCreatorName()+"\n status: " +task.getStatus()+"\n startDate: "+task.getStartDate() + "\nassignees: " + task.getCreatorName();
	}

	// Llamada a Gemini y manipulación de respuesta
	public String callGeminiToAtomize(String taskDescription) {
		String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey;
    
		// Crear el cuerpo de la solicitud en formato JSON
		JSONObject requestBody = new JSONObject();
		JSONArray contents = new JSONArray();
    
		// Primer mensaje - instrucción
		JSONObject firstMessage = new JSONObject();
		firstMessage.put("role", "user");
    
		JSONArray firstParts = new JSONArray();
		JSONObject firstTextPart = new JSONObject();
		firstTextPart.put("text", "Te voy a dar la informacion de una tarea. Necesito que a partir de esa tarea, crees tareas mas pequeñas que forman ese trabajo. De ser posible, piensa en tareas que se pueden paralelizar, o de otra forma, modularizar. Solo necesito que me mandes solo el objeto json sin ningún tipo de marcado o markup (sin ```, sin la palabra json, solo el array JSON puro o crudo) y que al inicio que tenga una propiedad generated con los siguientes campos title, tag, status, description, estimatedHours, startDate, endDate, creatorName, assignees - esos son todos los campos, el tag solo puede ser un issue o un feature y el campo de status, startDate, creatorname y assignees, te los voy a proveer yo");
		firstParts.put(firstTextPart);
    
		firstMessage.put("parts", firstParts);
		contents.put(firstMessage);
    
		// Segundo mensaje - la tarea
		JSONObject secondMessage = new JSONObject();
		secondMessage.put("role", "user");
    
		JSONArray secondParts = new JSONArray();
		JSONObject secondTextPart = new JSONObject();
		secondTextPart.put("text", taskDescription);
		secondParts.put(secondTextPart);
    
		secondMessage.put("parts", secondParts);
		contents.put(secondMessage);
    
		requestBody.put("contents", contents);
    
		try {
			// Crear cliente HTTP
			HttpClient client = HttpClient.newBuilder()
				.connectTimeout(Duration.ofSeconds(10))
				.build();
        
			// Crear la solicitud HTTP
			HttpRequest request = HttpRequest.newBuilder()
				.uri(URI.create(url))
				.header("Content-Type", "application/json")
				.POST(HttpRequest.BodyPublishers.ofString(requestBody.toString(), StandardCharsets.UTF_8))
				.build();
        
			// Enviar la solicitud y recibir la respuesta

			HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        
			// Analizar la respuesta JSON
			JSONObject jsonResponse = new JSONObject(response.body());
		
			if (jsonResponse.has("candidates") && jsonResponse.getJSONArray("candidates").length() > 0) {
				JSONObject candidate = jsonResponse.getJSONArray("candidates").getJSONObject(0);
            
				if (candidate.has("content") && candidate.getJSONObject("content").has("parts")) {
					JSONArray parts = candidate.getJSONObject("content").getJSONArray("parts");
                
					if (parts.length() > 0 && parts.getJSONObject(0).has("text")) {
						return parts.getJSONObject(0).getString("text");
					}
				}
			}
        
			logger.error("No se pudo extraer el texto de la respuesta: " + jsonResponse.toString());
			return null;
		} catch (Exception e) {
			logger.error("Error al llamar a la API de Gemini: " + e.getMessage(), e);
			return null;
		}
	}

	public String formatSubtasksForTelegram(String geminiResponse) {
		try {
			String cleanedResponse = cleanGeminiResponse(geminiResponse);

			// Crear un mensaje formateado para Telegram
			StringBuilder formattedMessage = new StringBuilder("🔄 Subtareas sugeridas:\n\n");
            
			// Intentar parsear como JSON
			JSONArray subtasksArray = new JSONArray(cleanedResponse);
            
			for (int i = 0; i < subtasksArray.length(); i++) {
				JSONObject subtask = subtasksArray.getJSONObject(i);
				JSONObject generated = subtask.getJSONObject("generated");
				formattedMessage.append("📌 Subtarea ").append(i + 1).append(":\n");
				formattedMessage.append("📝 Título: ").append(generated.getString("title")).append("\n");
				formattedMessage.append("🏷️ Tag: ").append(generated.getString("tag")).append("\n");
				formattedMessage.append("📊 Estado: ").append(generated.getString("status")).append("\n");
				formattedMessage.append("ℹ️ Descripción: ").append(generated.getString("description")).append("\n");
				formattedMessage.append("⏱️ Horas estimadas: ").append(generated.getDouble("estimatedHours")).append("\n\n");
			}
            
			return formattedMessage.toString();
            
		} catch (Exception e) {
			logger.error("Error al formatear la respuesta de Gemini: " + e.getMessage(), e);
			return "Error al procesar las subtareas sugeridas. Respuesta original:\n\n" + geminiResponse;
		}
	}

	
	public static String cleanGeminiResponse(String rawResponse) {
		// Intentar limpiar cualquier texto markdown que pueda haber en la respuesta
		String cleanedResponse = rawResponse.trim();
		if (cleanedResponse.startsWith("```json")) {
			cleanedResponse = cleanedResponse.substring("```json".length());
		} else if (cleanedResponse.startsWith("```")) {
			cleanedResponse = cleanedResponse.substring("```".length());
		}
		
		if (cleanedResponse.endsWith("```")) {
			cleanedResponse = cleanedResponse.substring(0, cleanedResponse.lastIndexOf("```"));
		}
		
		cleanedResponse = cleanedResponse.trim();
		return cleanedResponse;
	}	
}
