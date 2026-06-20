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
public class StreamInfoDto {
    private String videoId;
    private String title;
    private String sourceUrl;
    private String audioStreamUrl;
    private String videoStreamUrl;
    private String audioFormat;
    private String videoFormat;
    private String audioQuality;
    private String videoQuality;
    private MediaType recommendedType;
}
