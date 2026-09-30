package com.mindcare.backend.dto.doctor;

import com.mindcare.backend.domain.Doctor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record DoctorResponse(
        UUID id,
        String fullName,
        String gender,
        UUID specialtyId,
        String specialtyNameEn,
        String specialtyNameAr,
        String title,
        String bio,
        String avatarColor,
        BigDecimal consultationFee,
        BigDecimal rating,
        int ratingCount,
        int yearsExperience,
        boolean active,
        List<ShiftDto> shifts
) {
    public static DoctorResponse from(Doctor d) {
        List<ShiftDto> shifts = d.getShifts() == null ? List.of() :
                d.getShifts().stream().map(ShiftDto::from).toList();

        return new DoctorResponse(
                d.getId(),
                d.getFullName(),
                d.getGender().name(),
                d.getSpecialty().getId(),
                d.getSpecialty().getNameEn(),
                d.getSpecialty().getNameAr(),
                d.getTitle(),
                d.getBio(),
                d.getAvatarColor(),
                d.getConsultationFee(),
                d.getRating(),
                d.getRatingCount(),
                d.getYearsExperience(),
                d.isActive(),
                shifts
        );
    }
}
