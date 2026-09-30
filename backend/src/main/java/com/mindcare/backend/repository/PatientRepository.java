package com.mindcare.backend.repository;

import com.mindcare.backend.domain.Patient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PatientRepository extends JpaRepository<Patient, UUID> {

    List<Patient> findByPhoneOrEmail(String phone, String email);
}
