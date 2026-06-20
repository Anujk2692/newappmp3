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
public class PlayUrlDto {
    private String videoId;
    private MediaType type;
    private String streamUrl;
    private String contentType;
    private String quality;
    private boolean cached;
}
