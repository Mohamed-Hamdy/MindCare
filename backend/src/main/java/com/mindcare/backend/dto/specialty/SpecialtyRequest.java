package com.mindcare.backend.dto.specialty;

import jakarta.validation.constraints.NotBlank;

public record SpecialtyRequest(
        @NotBlank String nameAr,
        @NotBlank String nameEn,
        @NotBlank String icon,
        String description,
        boolean active
) {
}
