package com.mindcare.backend.dto.doctor;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record DoctorRequest(
        @NotBlank String fullName,
        @NotNull String gender,
        @NotNull UUID specialtyId,
        @NotBlank String title,
        String bio,
        @NotBlank String avatarColor,
        @NotNull @PositiveOrZero BigDecimal consultationFee,
        int yearsExperience,
        boolean active,
        @Valid List<ShiftDto> shifts
) {
}
