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
@Document(collection = "person_photos")
public class PersonPhoto {

    @Id
    private String id;

    private String personId;
    private String fileName;
    private String filePath;
    private double confidence;
    private String devicePhotoId;
    private Instant matchedAt;
}
