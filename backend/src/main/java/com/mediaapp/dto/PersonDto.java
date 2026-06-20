package com.mediaapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PersonDto {
    private String id;
    private String name;
    private String notes;
    private String imageUrl;
    private String createdAt;
    private long photoCount;
    private String lastRegisteredView;
    @Builder.Default
    private List<String> registeredViews = new ArrayList<>();
}
