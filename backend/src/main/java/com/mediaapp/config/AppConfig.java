package com.mediaapp.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class AppConfig implements WebMvcConfigurer {

    @Value("${app.storage.downloads-dir}")
    private String downloadsDir;

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public Path downloadsPath() {
        return Paths.get(downloadsDir).toAbsolutePath().normalize();
    }

    @Bean
    public Path facesPath(@Value("${app.storage.faces-dir}") String facesDir) {
        return Paths.get(facesDir).toAbsolutePath().normalize();
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Static files served by FileStreamController for Range/seek support
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns(allowedOrigins.split(","))
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(false);
        registry.addMapping("/files/**")
                .allowedOriginPatterns(allowedOrigins.split(","))
                .allowedMethods("GET", "HEAD", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(false);
    }
}
