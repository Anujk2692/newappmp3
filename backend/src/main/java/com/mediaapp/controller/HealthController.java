package com.mediaapp.controller;

import com.mediaapp.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class HealthController {

    private final MongoTemplate mongoTemplate;

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> health() {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("status", "UP");
        data.put("app", "MediaFace");

        try {
            mongoTemplate.getDb().runCommand(new org.bson.Document("ping", 1));
            data.put("mongodb", "UP");
        } catch (Exception e) {
            data.put("mongodb", "DOWN");
            data.put("status", "DEGRADED");
        }

        return ResponseEntity.ok(ApiResponse.ok(data));
    }
}
