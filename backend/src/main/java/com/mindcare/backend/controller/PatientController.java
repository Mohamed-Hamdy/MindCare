package com.mindcare.backend.controller;

import com.mindcare.backend.dto.patient.PatientRequest;
import com.mindcare.backend.dto.patient.PatientResponse;
import com.mindcare.backend.service.PatientService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientService patientService;

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    @GetMapping
    public List<PatientResponse> findAll() {
        return patientService.findAll().stream().map(PatientResponse::from).toList();
    }

    @GetMapping("/{id}")
    public PatientResponse findById(@PathVariable UUID id) {
        return PatientResponse.from(patientService.findById(id));
    }

    /** Public: used by the patient-portal booking form (no auth required). */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PatientResponse create(@Valid @RequestBody PatientRequest request) {
        return PatientResponse.from(patientService.create(request));
    }

    @PutMapping("/{id}")
    public PatientResponse update(@PathVariable UUID id, @Valid @RequestBody PatientRequest request) {
        return PatientResponse.from(patientService.update(id, request));
    }
}
