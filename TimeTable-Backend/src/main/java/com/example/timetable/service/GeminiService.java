package com.example.timetable.service;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@RequiredArgsConstructor
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    public String generateTimetableJson(String prompt) {
        try {
            String url = apiUrl + "?key=" + apiKey;

            Map<String, Object> part = new HashMap<>();
            part.put("text", prompt);

            Map<String, Object> content = new HashMap<>();
            content.put("parts", Collections.singletonList(part));

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", Collections.singletonList(content));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode textNode = root.path("candidates")
                        .get(0)
                        .path("content")
                        .path("parts")
                        .get(0)
                        .path("text");
                String text = objectMapper.treeToValue(textNode, String.class);
                
                if (text != null) {
                    // Clean up the text in case it's wrapped in triple backticks
                    if (text.contains("```json")) {
                        text = text.substring(text.indexOf("```json") + 7);
                        text = text.substring(0, text.lastIndexOf("```"));
                    } else if (text.contains("```")) {
                        text = text.substring(text.indexOf("```") + 3);
                        text = text.substring(0, text.lastIndexOf("```"));
                    }
                    return text.trim();
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }
}
