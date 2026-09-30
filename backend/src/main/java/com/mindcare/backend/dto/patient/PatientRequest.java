package com.mindcare.backend.dto.patient;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record PatientRequest(
        @NotBlank String fullName,
        @NotBlank String phone,
        @NotBlank @Email String email,
        @NotNull String gender,
        LocalDate dateOfBirth,
        String address,
        String chronicDiseases,
        String allergies,
        String currentMedications,
        String previousSurgeries,
        String notes
) {
}
