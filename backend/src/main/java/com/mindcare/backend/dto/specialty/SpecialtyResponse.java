package com.mindcare.backend.dto.specialty;

import com.mindcare.backend.domain.Specialty;

import java.time.Instant;
import java.util.UUID;

public record SpecialtyResponse(
        UUID id,
        String nameAr,
        String nameEn,
        String icon,
        String description,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {
    public static SpecialtyResponse from(Specialty s) {
        return new SpecialtyResponse(s.getId(), s.getNameAr(), s.getNameEn(), s.getIcon(),
                s.getDescription(), s.isActive(), s.getCreatedAt(), s.getUpdatedAt());
    }
}
