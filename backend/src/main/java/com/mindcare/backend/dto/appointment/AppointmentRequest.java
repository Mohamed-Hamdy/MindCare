package com.mindcare.backend.dto.appointment;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

/**
 * Books a new appointment. {@code patientId} is used when the caller already
 * knows the patient (staff booking); otherwise pass {@code newPatient} to
 * create-or-reuse a patient by phone/email in the same call (public booking
 * flow from the patient portal).
 */
public record AppointmentRequest(
        UUID patientId,
        NewPatient newPatient,
        @NotNull UUID doctorId,
        @NotNull LocalDate date,
        @NotNull LocalTime startTime,
        String reasonForVisit,
        boolean emergency
) {
    public record NewPatient(
            String fullName,
            String phone,
            String email,
            String gender
    ) {
    }
}
