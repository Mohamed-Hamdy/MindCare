package com.mindcare.backend.repository;

import com.mindcare.backend.domain.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DoctorRepository extends JpaRepository<Doctor, UUID> {

    List<Doctor> findBySpecialtyId(UUID specialtyId);

    List<Doctor> findByActiveTrue();
}
