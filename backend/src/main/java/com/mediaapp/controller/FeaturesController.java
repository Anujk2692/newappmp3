package com.mediaapp.controller;

import com.mediaapp.dto.ApiResponse;
import com.mediaapp.shared.features.FeatureFlagsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FeaturesController {

    private final FeatureFlagsService featureFlagsService;

    @GetMapping("/features")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> features() {
        return ResponseEntity.ok(ApiResponse.ok(featureFlagsService.snapshot()));
    }
}
