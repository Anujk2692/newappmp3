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
public class PrepareStatusDto {
    public enum Status {
        PREPARING,
        READY,
        FAILED
    }

    private String videoId;
    private MediaType type;
    private Status status;
    private String streamUrl;
    private String contentType;
    private String quality;
    private String message;
}
