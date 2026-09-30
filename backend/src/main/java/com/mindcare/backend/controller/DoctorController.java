package com.mindcare.backend.controller;

import com.mindcare.backend.dto.doctor.DoctorRequest;
import com.mindcare.backend.dto.doctor.DoctorResponse;
import com.mindcare.backend.service.DoctorService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    private final DoctorService doctorService;

    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    @GetMapping
    public List<DoctorResponse> findAll(@RequestParam(required = false) UUID specialtyId,
                                         @RequestParam(required = false, defaultValue = "false") boolean activeOnly) {
        return doctorService.findAll(specialtyId, activeOnly).stream().map(DoctorResponse::from).toList();
    }

    @GetMapping("/{id}")
    public DoctorResponse findById(@PathVariable UUID id) {
        return DoctorResponse.from(doctorService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DoctorResponse create(@Valid @RequestBody DoctorRequest request) {
        return DoctorResponse.from(doctorService.create(request));
    }

    @PutMapping("/{id}")
    public DoctorResponse update(@PathVariable UUID id, @Valid @RequestBody DoctorRequest request) {
        return DoctorResponse.from(doctorService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        doctorService.delete(id);
    }
}
