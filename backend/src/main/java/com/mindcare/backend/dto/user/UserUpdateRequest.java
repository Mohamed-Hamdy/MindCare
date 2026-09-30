package com.mindcare.backend.dto.user;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record UserUpdateRequest(
        @NotBlank String fullName,
        String password,
        UUID linkedDoctorId,
        boolean active
) {
}
