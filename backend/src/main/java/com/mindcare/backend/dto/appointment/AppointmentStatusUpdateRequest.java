package com.mindcare.backend.dto.appointment;

import jakarta.validation.constraints.NotNull;

/** Valid target statuses: CONFIRMED, WAITING, IN_EXAM, COMPLETED, CANCELLED, EMERGENCY. */
public record AppointmentStatusUpdateRequest(
        @NotNull String status
) {
}
