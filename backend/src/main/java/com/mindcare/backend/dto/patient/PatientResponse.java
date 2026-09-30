package com.mindcare.backend.dto.patient;

import com.mindcare.backend.domain.Patient;

import java.time.LocalDate;
import java.util.UUID;

public record PatientResponse(
        UUID id,
        String fullName,
        String phone,
        String email,
        String gender,
        LocalDate dateOfBirth,
        String address,
        String chronicDiseases,
        String allergies,
        String currentMedications,
        String previousSurgeries,
        String notes
) {
    public static PatientResponse from(Patient p) {
        return new PatientResponse(
                p.getId(), p.getFullName(), p.getPhone(), p.getEmail(), p.getGender().name(),
                p.getDateOfBirth(), p.getAddress(), p.getChronicDiseases(), p.getAllergies(),
                p.getCurrentMedications(), p.getPreviousSurgeries(), p.getNotes()
        );
    }
}
