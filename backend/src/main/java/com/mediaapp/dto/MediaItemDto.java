package com.mediaapp.dto;

import com.mediaapp.model.MediaType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MediaItemDto {
    private String id;
    private String title;
    private String sourceUrl;
    private MediaType type;
    private String fileName;
    private String streamUrl;
    private String thumbnailUrl;
    private Long fileSizeBytes;
    private String quality;
    private Integer durationSeconds;
    private String downloadedAt;
}
