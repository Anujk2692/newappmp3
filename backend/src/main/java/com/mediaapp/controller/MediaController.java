package com.mediaapp.controller;

import com.mediaapp.dto.*;
import com.mediaapp.model.MediaItem;
import com.mediaapp.model.MediaType;
import com.mediaapp.service.MediaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
public class MediaController {

    private final MediaService mediaService;

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<MediaSearchResultDto>>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "15") int limit) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(mediaService.search(q, limit)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/stream-info")
    public ResponseEntity<ApiResponse<StreamInfoDto>> streamInfo(@RequestParam String sourceUrl) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(mediaService.getStreamInfo(sourceUrl)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/play/{videoId}")
    public ResponseEntity<ApiResponse<PlayUrlDto>> play(
            @PathVariable String videoId,
            @RequestParam MediaType type) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(mediaService.preparePlayback(videoId, type)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/stream/{videoId}")
    public ResponseEntity<StreamingResponseBody> stream(
            @PathVariable String videoId,
            @RequestParam MediaType type) {
        StreamingResponseBody body = outputStream -> {
            try {
                mediaService.writeStream(videoId, type, outputStream);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("Stream interrupted");
            }
        };
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, mediaService.getStreamContentType(type))
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header(HttpHeaders.CACHE_CONTROL, "no-cache")
                .body(body);
    }

    @PostMapping("/download")
    public ResponseEntity<ApiResponse<MediaItemDto>> download(@RequestBody DownloadRequest request) {
        try {
            MediaItem item = mediaService.download(
                    request.getVideoId(),
                    request.getTitle(),
                    request.getSourceUrl(),
                    request.getType()
            );
            return ResponseEntity.ok(ApiResponse.ok("Download complete", toDto(item)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/library/audio")
    public ResponseEntity<ApiResponse<List<MediaItemDto>>> audioLibrary() {
        List<MediaItemDto> items = mediaService.listByType(MediaType.AUDIO).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(items));
    }

    @GetMapping("/library/video")
    public ResponseEntity<ApiResponse<List<MediaItemDto>>> videoLibrary() {
        List<MediaItemDto> items = mediaService.listByType(MediaType.VIDEO).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(items));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        try {
            mediaService.delete(id);
            return ResponseEntity.ok(ApiResponse.ok("Deleted", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    private MediaItemDto toDto(MediaItem item) {
        return MediaItemDto.builder()
                .id(item.getId())
                .title(item.getTitle())
                .sourceUrl(item.getSourceUrl())
                .type(item.getType())
                .fileName(item.getFileName())
                .streamUrl("/files/" + (item.getType() == MediaType.AUDIO ? "audio" : "video") + "/" + item.getFileName())
                .thumbnailUrl(item.getThumbnailUrl())
                .fileSizeBytes(item.getFileSizeBytes())
                .quality(item.getQuality())
                .durationSeconds(item.getDurationSeconds())
                .downloadedAt(item.getDownloadedAt() != null ? item.getDownloadedAt().toString() : null)
                .build();
    }
}
