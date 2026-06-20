package com.mediaapp.service;

import com.mediaapp.model.FaceViewAngle;
import lombok.Builder;
import lombok.Value;
import org.opencv.core.Mat;

@Value
@Builder
public class RegistrationFeature {
    Mat feature;
    FaceViewAngle detectedAngle;
    double detectionScore;
}
