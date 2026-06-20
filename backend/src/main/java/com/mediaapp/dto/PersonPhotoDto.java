package com.mediaapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PersonPhotoDto {
    private String id;
    private String personId;
    private String imageUrl;
    private double confidence;
    private String matchedAt;
}
