package com.mindcare.backend.service;

import com.mindcare.backend.common.ApiException;
import com.mindcare.backend.domain.Gender;
import com.mindcare.backend.domain.Patient;
import com.mindcare.backend.dto.patient.PatientRequest;
import com.mindcare.backend.repository.PatientRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class PatientService {

    private final PatientRepository patientRepository;

    public PatientService(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    @Transactional(readOnly = true)
    public List<Patient> findAll() {
        return patientRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Patient findById(UUID id) {
        return patientRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Patient not found: " + id));
    }

    public Patient create(PatientRequest request) {
        Patient patient = new Patient();
        apply(patient, request);
        return patientRepository.save(patient);
    }

    public Patient update(UUID id, PatientRequest request) {
        Patient patient = findById(id);
        apply(patient, request);
        return patientRepository.save(patient);
    }

    /** Used by the public booking flow: reuse an existing patient by phone/email, or create one. */
    public Patient findOrCreate(String fullName, String phone, String email, String genderRaw) {
        List<Patient> matches = patientRepository.findByPhoneOrEmail(phone, email);
        if (!matches.isEmpty()) {
            return matches.get(0);
        }

        Patient patient = new Patient();
        patient.setFullName(fullName);
        patient.setPhone(phone);
        patient.setEmail(email);
        patient.setGender(parseGender(genderRaw));
        return patientRepository.save(patient);
    }

    private void apply(Patient patient, PatientRequest request) {
        patient.setFullName(request.fullName());
        patient.setPhone(request.phone());
        patient.setEmail(request.email());
        patient.setGender(parseGender(request.gender()));
        patient.setDateOfBirth(request.dateOfBirth());
        patient.setAddress(request.address());
        patient.setChronicDiseases(request.chronicDiseases());
        patient.setAllergies(request.allergies());
        patient.setCurrentMedications(request.currentMedications());
        patient.setPreviousSurgeries(request.previousSurgeries());
        patient.setNotes(request.notes());
    }

    private Gender parseGender(String value) {
        try {
            return Gender.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw ApiException.badRequest("Invalid gender: " + value + " (expected MALE or FEMALE)");
        }
    }
}
