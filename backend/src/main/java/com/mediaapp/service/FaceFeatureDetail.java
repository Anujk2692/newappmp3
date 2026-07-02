package com.mediaapp.service;

import lombok.Builder;
import lombok.Value;
import org.opencv.core.Mat;

/** One detected face with embedding and bounding box (for group photos). */
@Value
@Builder
public class FaceFeatureDetail {
    Mat feature;
    int faceIndex;
    int totalFaces;
    double boxX;
    double boxY;
    double boxW;
    double boxH;

    public void release() {
        if (feature != null) {
            feature.release();
        }
    }
}
