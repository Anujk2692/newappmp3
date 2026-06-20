package com.mediaapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LibraryScanResultDto {
    private String devicePhotoId;
    private boolean matched;
    private boolean saved;
    private double confidence;
    private String photoId;
}
