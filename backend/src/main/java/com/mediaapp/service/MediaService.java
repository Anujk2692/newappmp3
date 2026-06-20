package com.mediaapp.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mediaapp.dto.MediaSearchResultDto;
import com.mediaapp.dto.PlayUrlDto;
import com.mediaapp.dto.StreamInfoDto;
import com.mediaapp.model.MediaItem;
import com.mediaapp.model.MediaType;
import com.mediaapp.repository.MediaItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MediaService {

    private final MediaItemRepository mediaItemRepository;
    private final ObjectMapper objectMapper;
    private final Path downloadsPath;

    private final Map<String, Object> downloadLocks = new ConcurrentHashMap<>();

    @Value("${app.media.yt-dlp-path:yt-dlp}")
    private String ytDlpPath;

    public List<MediaSearchResultDto> search(String query, int limit) {
        if (query == null || query.isBlank()) {
            return List.of();
        }

        try {
            ProcessBuilder pb = new ProcessBuilder(
                    ytDlpPath,
                    "ytsearch" + Math.min(limit, 20) + ":" + query.trim(),
                    "--dump-json",
                    "--skip-download",
                    "--flat-playlist"
            );
            pb.redirectErrorStream(true);
            Process process = pb.start();

            List<MediaSearchResultDto> results = new ArrayList<>();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    parseSearchLine(line).ifPresent(results::add);
                }
            }

            if (!process.waitFor(60, TimeUnit.SECONDS)) {
                process.destroyForcibly();
                throw new IllegalStateException("Search timed out. Ensure yt-dlp is installed.");
            }
            if (process.exitValue() != 0) {
                throw new IllegalStateException("Search failed. Check yt-dlp and network.");
            }

            return results.stream()
                    .limit(limit)
                    .map(this::enrichWithStreamUrls)
                    .collect(Collectors.toList());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Search interrupted");
        } catch (IOException e) {
            log.error("Search failed", e);
            throw new IllegalStateException("Search failed. Install yt-dlp: brew install yt-dlp");
        }
    }

    private MediaSearchResultDto enrichWithStreamUrls(MediaSearchResultDto result) {
        result.setAudioFormat("MP3 / M4A");
        result.setVideoFormat("MP4 / HD");
        result.setAudioStreamUrl("/api/media/play/" + result.getVideoId() + "?type=AUDIO");
        result.setVideoStreamUrl("/api/media/play/" + result.getVideoId() + "?type=VIDEO");
        return result;
    }

    public PlayUrlDto preparePlayback(String videoId, MediaType type) {
        try {
            Path cached = ensureCachedPlayback(videoId, type);
            String ext = cached.getFileName().toString().substring(cached.getFileName().toString().lastIndexOf('.'));
            return PlayUrlDto.builder()
                    .videoId(videoId)
                    .type(type)
                    .streamUrl("/files/cache/" + cached.getFileName())
                    .contentType(type == MediaType.AUDIO ? "audio/mp4" : "video/mp4")
                    .quality(type == MediaType.AUDIO ? "Best Audio" : videoQualityLabel())
                    .cached(true)
                    .build();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Playback preparation interrupted");
        } catch (IOException e) {
            log.error("Playback prepare failed for {} {}", videoId, type, e);
            throw new IllegalStateException("Could not prepare playback. Try download instead.");
        }
    }

    private Path ensureCachedPlayback(String videoId, MediaType type)
            throws IOException, InterruptedException {
        Path cacheDir = downloadsPath.resolve("cache");
        Files.createDirectories(cacheDir);

        String ext = type == MediaType.AUDIO ? ".m4a" : ".mp4";
        Path cached = cacheDir.resolve(videoId + "_" + type.name().toLowerCase() + ext);

        if (Files.exists(cached) && Files.size(cached) > 0) {
            if (type == MediaType.VIDEO && !isValidMp4(cached)) {
                log.warn("Removing invalid video cache (not MP4): {}", cached);
                Files.deleteIfExists(cached);
            } else {
                return cached;
            }
        }

        String lockKey = videoId + ":" + type;
        Object lock = downloadLocks.computeIfAbsent(lockKey, k -> new Object());
        synchronized (lock) {
            if (Files.exists(cached) && Files.size(cached) > 0) {
                if (type == MediaType.VIDEO && !isValidMp4(cached)) {
                    Files.deleteIfExists(cached);
                } else {
                    return cached;
                }
            }
            downloadToFile(buildSourceUrl(videoId), type, cached, true);
            return cached;
        }
    }

    public StreamInfoDto getStreamInfo(String sourceUrl) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(ytDlpPath, "-J", "--no-playlist", sourceUrl);
        pb.redirectErrorStream(true);
        Process process = pb.start();

        String json;
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            json = reader.lines().collect(Collectors.joining("\n"));
        }

        if (!process.waitFor(45, TimeUnit.SECONDS)) {
            process.destroyForcibly();
            throw new IllegalStateException("Failed to read stream info");
        }
        if (process.exitValue() != 0) {
            throw new IllegalStateException("Could not read media info from source");
        }

        JsonNode node = objectMapper.readTree(json);
        String videoId = node.path("id").asText();

        return StreamInfoDto.builder()
                .videoId(videoId)
                .title(node.path("title").asText("Unknown"))
                .sourceUrl(sourceUrl)
                .audioFormat("M4A / MP3")
                .videoFormat("MP4")
                .audioQuality("Best Audio")
                .videoQuality("Best Video")
                .audioStreamUrl("/api/media/play/" + videoId + "?type=AUDIO")
                .videoStreamUrl("/api/media/play/" + videoId + "?type=VIDEO")
                .build();
    }

    public void writeStream(String videoId, MediaType type, java.io.OutputStream outputStream)
            throws IOException, InterruptedException {
        Path cached = ensureCachedPlayback(videoId, type);
        Files.copy(cached, outputStream);
    }

    public String getStreamContentType(MediaType type) {
        return type == MediaType.AUDIO ? "audio/mp4" : "video/mp4";
    }

    public MediaItem download(String videoId, String title, String sourceUrl, MediaType type) {
        String lockKey = "dl:" + videoId + ":" + type;
        Object lock = downloadLocks.computeIfAbsent(lockKey, k -> new Object());
        synchronized (lock) {
            if (mediaItemRepository.existsBySourceIdAndType(videoId, type)) {
                return mediaItemRepository.findBySourceIdAndType(videoId, type).orElseThrow();
            }

            try {
                Path targetDir = downloadsPath.resolve(type == MediaType.AUDIO ? "audio" : "video");
                Files.createDirectories(targetDir);
                String safeTitle = sanitize(title);
                Path outputPath = downloadLibraryFile(sourceUrl, type, targetDir, safeTitle, videoId);

                MediaItem item = MediaItem.builder()
                        .title(title)
                        .sourceUrl(sourceUrl)
                        .sourceId(videoId)
                        .type(type)
                        .fileName(outputPath.getFileName().toString())
                        .filePath(outputPath.toString())
                        .thumbnailUrl("https://i.ytimg.com/vi/" + videoId + "/hqdefault.jpg")
                        .fileSizeBytes(Files.size(outputPath))
                        .quality(type == MediaType.AUDIO
                                ? (outputPath.getFileName().toString().endsWith(".mp3") ? "MP3" : "M4A Audio")
                                : videoQualityLabel())
                        .downloadedAt(Instant.now())
                        .build();

                return mediaItemRepository.save(item);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("Download interrupted");
            } catch (IOException e) {
                log.error("Download failed", e);
                throw new IllegalStateException("Download failed: " + e.getMessage());
            }
        }
    }

    private Path downloadLibraryFile(String sourceUrl, MediaType type, Path targetDir,
                                     String safeTitle, String videoId)
            throws IOException, InterruptedException {
        if (type == MediaType.AUDIO) {
            if (isFfmpegAvailable()) {
                try {
                    String template = targetDir.resolve(safeTitle + "_" + videoId + ".%(ext)s").toString();
                    runYtDlp(List.of(
                            ytDlpPath, sourceUrl, "--no-playlist", "--no-warnings",
                            "-f", "bestaudio/best", "-x", "--audio-format", "mp3",
                            "--audio-quality", "0", "-o", template
                    ));
                    return findFileWithExtension(targetDir, videoId, ".mp3");
                } catch (Exception e) {
                    log.warn("MP3 download failed, using M4A: {}", e.getMessage());
                }
            }
            Path m4a = targetDir.resolve(safeTitle + "_" + videoId + ".m4a");
            runYtDlp(List.of(
                    ytDlpPath, sourceUrl, "--no-playlist", "--no-warnings",
                    "-f", "bestaudio[ext=m4a]/bestaudio/best",
                    "-o", m4a.toString()
            ));
            return m4a;
        }

        Path output = targetDir.resolve(safeTitle + "_" + videoId + ".mp4");
        runYtDlp(buildVideoDownloadCommand(sourceUrl, output.toString()));
        validatePlayableVideo(output);
        return output;
    }

    private String videoQualityLabel() {
        return isFfmpegAvailable() ? "HD Video (720p)" : "Video (360p MP4)";
    }

    private List<String> buildVideoDownloadCommand(String sourceUrl, String outputPath) {
        List<String> command = new ArrayList<>();
        command.add(ytDlpPath);
        command.add(sourceUrl);
        command.add("--no-playlist");
        command.add("--no-warnings");
        if (isFfmpegAvailable()) {
            command.add("-f");
            command.add("bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best[ext=mp4]/best");
            command.add("--merge-output-format");
            command.add("mp4");
        } else {
            // Progressive MP4 only — avoids HLS/MPEG-TS files that mobile players cannot play
            command.add("-f");
            command.add("22/18/best[height<=480][ext=mp4][vcodec^=avc1][acodec^=mp4a]/18");
        }
        command.add("-o");
        command.add(outputPath);
        return command;
    }

    private void validatePlayableVideo(Path path) throws IOException {
        if (!Files.exists(path) || Files.size(path) == 0) {
            throw new IllegalStateException("Downloaded video missing or empty");
        }
        if (!isValidMp4(path)) {
            Files.deleteIfExists(path);
            throw new IllegalStateException(
                    "Video format not supported on device. Install ffmpeg for HD: brew install ffmpeg");
        }
    }

    private boolean isValidMp4(Path path) {
        try {
            byte[] header = new byte[12];
            try (var in = Files.newInputStream(path)) {
                if (in.read(header) < 8) {
                    return false;
                }
            }
            return header[4] == 'f' && header[5] == 't' && header[6] == 'y' && header[7] == 'p';
        } catch (IOException e) {
            return false;
        }
    }

    private boolean isFfmpegAvailable() {
        try {
            Process process = new ProcessBuilder("ffmpeg", "-version").start();
            boolean finished = process.waitFor(5, TimeUnit.SECONDS);
            return finished && process.exitValue() == 0;
        } catch (Exception e) {
            return false;
        }
    }

    private Path findFileWithExtension(Path dir, String videoId, String ext) throws IOException {
        try (var stream = Files.list(dir)) {
            return stream
                    .filter(p -> p.getFileName().toString().contains(videoId))
                    .filter(p -> p.getFileName().toString().endsWith(ext))
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException("Downloaded file not found"));
        }
    }

    private void downloadToFile(String sourceUrl, MediaType type, Path outputPath, boolean forPlayback)
            throws IOException, InterruptedException {
        Files.createDirectories(outputPath.getParent());

        if (type == MediaType.AUDIO) {
            runYtDlp(List.of(
                    ytDlpPath, sourceUrl, "--no-playlist", "--no-warnings",
                    "-f", "bestaudio[ext=m4a]/bestaudio/best",
                    "-o", outputPath.toString()
            ));
        } else {
            runYtDlp(buildVideoDownloadCommand(sourceUrl, outputPath.toString()));
            validatePlayableVideo(outputPath);
        }

        if (!Files.exists(outputPath) || Files.size(outputPath) == 0) {
            throw new IllegalStateException("Downloaded file missing or empty");
        }
    }

    private void runYtDlp(List<String> command) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(command);
        pb.redirectErrorStream(true);
        Process process = pb.start();

        StringBuilder output = new StringBuilder();
        Thread drain = new Thread(() -> {
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    log.debug("yt-dlp: {}", line);
                    if (output.length() < 4000) {
                        output.append(line).append('\n');
                    }
                }
            } catch (IOException ignored) {
            }
        });
        drain.start();

        if (!process.waitFor(600, TimeUnit.SECONDS)) {
            process.destroyForcibly();
            throw new IllegalStateException("Download timed out after 10 minutes");
        }
        drain.join(5000);

        if (process.exitValue() != 0) {
            String tail = output.toString().trim();
            if (tail.length() > 200) {
                tail = tail.substring(tail.length() - 200);
            }
            throw new IllegalStateException(
                    tail.isBlank()
                            ? "yt-dlp failed. Install ffmpeg: brew install ffmpeg"
                            : "yt-dlp failed: " + tail
            );
        }
    }

    private String buildSourceUrl(String videoId) {
        return "https://www.youtube.com/watch?v=" + videoId;
    }

    private Optional<MediaSearchResultDto> parseSearchLine(String line) {
        try {
            JsonNode node = objectMapper.readTree(line);
            String id = node.path("id").asText(null);
            if (id == null || id.isBlank()) {
                return Optional.empty();
            }
            return Optional.of(MediaSearchResultDto.builder()
                    .videoId(id)
                    .title(node.path("title").asText("Unknown"))
                    .thumbnailUrl(resolveThumbnail(node))
                    .channel(node.path("uploader").asText(node.path("channel").asText("Unknown")))
                    .durationSeconds(node.path("duration").isNumber() ? node.path("duration").asInt() : null)
                    .sourceUrl(buildSourceUrl(id))
                    .build());
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    private String resolveThumbnail(JsonNode node) {
        if (node.has("thumbnail")) {
            return node.path("thumbnail").asText();
        }
        if (node.has("thumbnails") && node.path("thumbnails").isArray() && !node.path("thumbnails").isEmpty()) {
            return node.path("thumbnails").get(node.path("thumbnails").size() - 1).path("url").asText();
        }
        String id = node.path("id").asText("");
        return "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg";
    }

    public List<MediaItem> listByType(MediaType type) {
        return mediaItemRepository.findByTypeOrderByDownloadedAtDesc(type);
    }

    public void delete(String id) throws IOException {
        MediaItem item = mediaItemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Media not found"));
        Path file = Path.of(item.getFilePath());
        if (Files.exists(file)) {
            Files.delete(file);
        }
        mediaItemRepository.delete(item);
    }

    private String sanitize(String input) {
        String cleaned = input.replaceAll("[^a-zA-Z0-9._-]", "_");
        return cleaned.length() > 60 ? cleaned.substring(0, 60) : cleaned;
    }
}
