package com.mediaapp.util;

import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.io.IOException;
import java.io.InputStream;
import java.io.RandomAccessFile;
import java.nio.file.Files;
import java.nio.file.Path;

public final class RangeFileResponse {

    private RangeFileResponse() {}

    public static ResponseEntity<Resource> serve(Path file, String contentType, String rangeHeader)
            throws IOException {
        if (!Files.exists(file) || !Files.isRegularFile(file)) {
            return ResponseEntity.notFound().build();
        }

        long fileSize = Files.size(file);
        MediaType mediaType = MediaType.parseMediaType(contentType);

        if (rangeHeader == null || !rangeHeader.startsWith("bytes=")) {
            return ResponseEntity.ok()
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(fileSize))
                    .contentType(mediaType)
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
                .contentType(mediaType)
                .body(new InputStreamResource(partialStream));
    }

    public static String resolveVideoContentType(String fileName) {
        String lower = fileName.toLowerCase();
        if (lower.endsWith(".mov")) {
            return "video/quicktime";
        }
        if (lower.endsWith(".mp4")) {
            return "video/mp4";
        }
        if (lower.endsWith(".m4v")) {
            return "video/x-m4v";
        }
        return "video/mp4";
    }
}
