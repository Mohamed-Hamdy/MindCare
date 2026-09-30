package com.mindcare.backend.controller;

import com.mindcare.backend.common.ApiException;
import com.mindcare.backend.domain.AppointmentStatus;
import com.mindcare.backend.dto.appointment.AppointmentRequest;
import com.mindcare.backend.dto.appointment.AppointmentResponse;
import com.mindcare.backend.dto.appointment.AppointmentStatusUpdateRequest;
import com.mindcare.backend.service.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @GetMapping
    public List<AppointmentResponse> findAll(
            @RequestParam(required = false) UUID doctorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return appointmentService.findAll(doctorId, date).stream().map(AppointmentResponse::from).toList();
    }

    @GetMapping("/{id}")
    public AppointmentResponse findById(@PathVariable UUID id) {
        return AppointmentResponse.from(appointmentService.findById(id));
    }

    /** Public: the patient-portal booking flow calls this with no auth required. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AppointmentResponse book(@Valid @RequestBody AppointmentRequest request) {
        return AppointmentResponse.from(appointmentService.book(request));
    }

    /** Staff-only (reception/doctor/admin): drive an appointment through the queue workflow. */
    @PatchMapping("/{id}/status")
    public AppointmentResponse updateStatus(@PathVariable UUID id, @Valid @RequestBody AppointmentStatusUpdateRequest request) {
        return AppointmentResponse.from(appointmentService.updateStatus(id, parseStatus(request.status())));
    }

    private AppointmentStatus parseStatus(String value) {
        try {
            return AppointmentStatus.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw ApiException.badRequest("Invalid status: " + value);
        }
    }
}
