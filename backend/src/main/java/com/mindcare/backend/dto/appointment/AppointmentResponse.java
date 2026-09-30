package com.mindcare.backend.dto.appointment;

import com.mindcare.backend.domain.Appointment;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record AppointmentResponse(
        UUID id,
        UUID patientId,
        String patientFullName,
        UUID doctorId,
        String doctorFullName,
        UUID specialtyId,
        LocalDate date,
        LocalTime startTime,
        LocalTime endTime,
        String status,
        String reasonForVisit,
        Integer queueNumber,
        Instant checkedInAt,
        Instant startedAt,
        Instant completedAt,
        boolean emergency
) {
    public static AppointmentResponse from(Appointment a) {
        return new AppointmentResponse(
                a.getId(),
                a.getPatient().getId(),
                a.getPatient().getFullName(),
                a.getDoctor().getId(),
                a.getDoctor().getFullName(),
                a.getSpecialty().getId(),
                a.getDate(),
                a.getStartTime(),
                a.getEndTime(),
                a.getStatus().name(),
                a.getReasonForVisit(),
                a.getQueueNumber(),
                a.getCheckedInAt(),
                a.getStartedAt(),
                a.getCompletedAt(),
                a.isEmergency()
        );
    }
}
