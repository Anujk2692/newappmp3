package com.mediaapp.repository;

import com.mediaapp.model.MediaItem;
import com.mediaapp.model.MediaType;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface MediaItemRepository extends MongoRepository<MediaItem, String> {
    List<MediaItem> findByTypeOrderByDownloadedAtDesc(MediaType type);
    Optional<MediaItem> findBySourceIdAndType(String sourceId, MediaType type);
    boolean existsBySourceIdAndType(String sourceId, MediaType type);
}
