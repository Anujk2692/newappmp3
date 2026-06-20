package com.mediaapp.repository;

import com.mediaapp.model.Person;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface PersonRepository extends MongoRepository<Person, String> {
    Optional<Person> findByNameIgnoreCase(String name);
}
