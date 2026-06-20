package com.mediaapp.controller;

import com.mediaapp.dto.ApiResponse;
import com.mediaapp.dto.FaceIdentifyResult;
import com.mediaapp.dto.LibraryScanResultDto;
import com.mediaapp.dto.PersonDto;
import com.mediaapp.dto.PersonPhotoDto;
import com.mediaapp.service.FaceRecognitionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/faces")
@RequiredArgsConstructor
public class FaceController {

    private final FaceRecognitionService faceRecognitionService;

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<com.mediaapp.dto.FaceStatusDto>> status() {
        return ResponseEntity.ok(ApiResponse.ok(faceRecognitionService.getStatus()));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PersonDto>>> list() {
        try {
            return ResponseEntity.ok(ApiResponse.ok(faceRecognitionService.listPersons()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<PersonDto>> register(
            @RequestParam String name,
            @RequestParam(required = false) String notes,
            @RequestParam(required = false) String viewHint,
            @RequestParam("image") MultipartFile image) {
        try {
            PersonDto person = faceRecognitionService.registerPerson(name, notes, image, viewHint);
            String viewLabel = person.getLastRegisteredView() != null
                    ? person.getLastRegisteredView()
                    : "ANY";
            return ResponseEntity.ok(ApiResponse.ok(
                    "Face saved (" + viewLabel + " view). Add more angles for best accuracy.",
                    person));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping(value = "/identify", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<FaceIdentifyResult>> identify(@RequestParam("image") MultipartFile image) {
        try {
            FaceIdentifyResult result = faceRecognitionService.identify(image);
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/person/{personId}/photos")
    public ResponseEntity<ApiResponse<List<PersonPhotoDto>>> personPhotos(@PathVariable String personId) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(faceRecognitionService.listPersonPhotos(personId)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping(value = "/person/{personId}/scan-library", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<LibraryScanResultDto>> scanLibraryPhoto(
            @PathVariable String personId,
            @RequestParam("image") MultipartFile image,
            @RequestParam(required = false) String devicePhotoId) {
        try {
            LibraryScanResultDto result = faceRecognitionService.scanLibraryPhoto(personId, image, devicePhotoId);
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/photos/{photoId}")
    public ResponseEntity<ApiResponse<Void>> deletePhoto(@PathVariable String photoId) {
        try {
            faceRecognitionService.deletePersonPhoto(photoId);
            return ResponseEntity.ok(ApiResponse.ok("Deleted", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        try {
            faceRecognitionService.deletePerson(id);
            return ResponseEntity.ok(ApiResponse.ok("Deleted", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/image")
    public ResponseEntity<byte[]> image(@RequestParam String path) {
        try {
            byte[] data = faceRecognitionService.getFaceImage(path);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.IMAGE_JPEG_VALUE)
                    .body(data);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
