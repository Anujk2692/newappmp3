package com.mediaapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "media_items")
public class MediaItem {

    @Id
    private String id;

    private String title;
    private String sourceUrl;
    private String sourceId;
    private MediaType type;
    private String fileName;
    private String filePath;
    private String thumbnailUrl;
    private Long fileSizeBytes;
    private String quality;
    private Integer durationSeconds;
    private Instant downloadedAt;
}
