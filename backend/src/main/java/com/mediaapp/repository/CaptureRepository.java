package com.mediaapp.repository;

import com.mediaapp.model.Capture;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface CaptureRepository extends MongoRepository<Capture, String> {

    List<Capture> findAllByOrderByCapturedAtDesc();
}
