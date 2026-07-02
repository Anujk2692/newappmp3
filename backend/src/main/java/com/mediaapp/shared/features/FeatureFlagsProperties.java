package com.mediaapp.shared.features;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "app.features")
public class FeatureFlagsProperties {

    private boolean mediaSearch = true;
    private boolean mediaDownload = true;
    private boolean mediaOfflineCache = true;
    private boolean faceAi = true;
    private boolean faceLibraryScan = true;
    private boolean cameraCapture = true;
    private boolean cameraGeotag = true;
    private boolean deviceStorage = true;
}
