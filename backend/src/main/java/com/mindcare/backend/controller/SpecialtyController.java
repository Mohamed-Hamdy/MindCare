package com.mindcare.backend.controller;

import com.mindcare.backend.dto.specialty.SpecialtyRequest;
import com.mindcare.backend.dto.specialty.SpecialtyResponse;
import com.mindcare.backend.service.SpecialtyService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/specialties")
public class SpecialtyController {

    private final SpecialtyService specialtyService;

    public SpecialtyController(SpecialtyService specialtyService) {
        this.specialtyService = specialtyService;
    }

    @GetMapping
    public List<SpecialtyResponse> findAll() {
        return specialtyService.findAll().stream().map(SpecialtyResponse::from).toList();
    }

    @GetMapping("/{id}")
    public SpecialtyResponse findById(@PathVariable UUID id) {
        return SpecialtyResponse.from(specialtyService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SpecialtyResponse create(@Valid @RequestBody SpecialtyRequest request) {
        return SpecialtyResponse.from(specialtyService.create(request));
    }

    @PutMapping("/{id}")
    public SpecialtyResponse update(@PathVariable UUID id, @Valid @RequestBody SpecialtyRequest request) {
        return SpecialtyResponse.from(specialtyService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        specialtyService.delete(id);
    }
}
