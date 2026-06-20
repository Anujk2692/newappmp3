package com.mediaapp.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.InputStream;
import java.io.RandomAccessFile;
import java.nio.file.Files;
import java.nio.file.Path;

@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
public class FileStreamController {

    private final Path downloadsPath;

    @GetMapping("/**")
    public ResponseEntity<Resource> streamFile(
            jakarta.servlet.http.HttpServletRequest request,
            @RequestHeader(value = HttpHeaders.RANGE, required = false) String rangeHeader)
            throws IOException {

        String uri = request.getRequestURI();
        String relative = uri.substring("/files/".length());
        Path file = downloadsPath.resolve(relative).normalize();

        if (!file.startsWith(downloadsPath) || !Files.exists(file) || !Files.isRegularFile(file)) {
            return ResponseEntity.notFound().build();
        }

        long fileSize = Files.size(file);
        String contentType = resolveContentType(file.getFileName().toString());

        if (rangeHeader == null || !rangeHeader.startsWith("bytes=")) {
            return ResponseEntity.ok()
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(fileSize))
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(new InputStreamResource(Files.newInputStream(file)));
        }

        String[] parts = rangeHeader.replace("bytes=", "").split("-");
        long start = Long.parseLong(parts[0]);
        long end = parts.length > 1 && !parts[1].isBlank()
                ? Long.parseLong(parts[1])
                : fileSize - 1;
        end = Math.min(end, fileSize - 1);

        if (start > end || start >= fileSize) {
            return ResponseEntity.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                    .header(HttpHeaders.CONTENT_RANGE, "bytes */" + fileSize)
                    .build();
        }

        long contentLength = end - start + 1;
        RandomAccessFile raf = new RandomAccessFile(file.toFile(), "r");
        raf.seek(start);

        InputStream partialStream = new InputStream() {
            private long remaining = contentLength;

            @Override
            public int read() throws IOException {
                if (remaining <= 0) {
                    raf.close();
                    return -1;
                }
                int value = raf.read();
                if (value >= 0) {
                    remaining--;
                } else {
                    raf.close();
                }
                return value;
            }

            @Override
            public int read(byte[] b, int off, int len) throws IOException {
                if (remaining <= 0) {
                    raf.close();
                    return -1;
                }
                int toRead = (int) Math.min(len, remaining);
                int read = raf.read(b, off, toRead);
                if (read > 0) {
                    remaining -= read;
                }
                if (remaining <= 0) {
                    raf.close();
                }
                return read;
            }

            @Override
            public void close() throws IOException {
                raf.close();
            }
        };

        return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header(HttpHeaders.CONTENT_RANGE, "bytes " + start + "-" + end + "/" + fileSize)
                .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(contentLength))
                .contentType(MediaType.parseMediaType(contentType))
                .body(new InputStreamResource(partialStream));
    }

    private String resolveContentType(String name) {
        if (name.endsWith(".mp3")) {
            return "audio/mpeg";
        }
        if (name.endsWith(".m4a")) {
            return "audio/mp4";
        }
        if (name.endsWith(".mp4")) {
            return "video/mp4";
        }
        return "application/octet-stream";
    }
}
