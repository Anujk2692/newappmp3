package com.mediaapp.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@Component
@RequiredArgsConstructor
public class StorageInitializer {

    private final Path downloadsPath;
    private final Path facesPath;

    @PostConstruct
    public void init() throws IOException {
        Files.createDirectories(downloadsPath.resolve("audio"));
        Files.createDirectories(downloadsPath.resolve("video"));
        Files.createDirectories(downloadsPath.resolve("cache"));
        Files.createDirectories(facesPath);
    }
}
