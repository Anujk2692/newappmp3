package com.mediaapp.shared.features;

import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class FeatureFlagsService {

    private final FeatureFlagsProperties properties;

    public FeatureFlagsService(FeatureFlagsProperties properties) {
        this.properties = properties;
    }

    public Map<String, Boolean> snapshot() {
        Map<String, Boolean> flags = new LinkedHashMap<>();
        flags.put("mediaSearch", properties.isMediaSearch());
        flags.put("mediaDownload", properties.isMediaDownload());
        flags.put("mediaOfflineCache", properties.isMediaOfflineCache());
        flags.put("faceAi", properties.isFaceAi());
        flags.put("faceLibraryScan", properties.isFaceLibraryScan());
        flags.put("cameraCapture", properties.isCameraCapture());
        flags.put("cameraGeotag", properties.isCameraGeotag());
        flags.put("deviceStorage", properties.isDeviceStorage());
        return flags;
    }

    public boolean isEnabled(String key) {
        return snapshot().getOrDefault(key, false);
    }

    public void requireEnabled(String key) {
        if (!isEnabled(key)) {
            throw new IllegalStateException("Feature disabled: " + key);
        }
    }
}
