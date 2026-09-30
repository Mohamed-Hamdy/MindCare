package com.mindcare.backend.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record UserCreateRequest(
        @NotBlank String fullName,
        @NotBlank String username,
        @NotBlank String password,
        @NotNull String role,
        UUID linkedDoctorId
) {
}
