package com.mindcare.backend.repository;

import com.mindcare.backend.domain.DoctorShift;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DoctorShiftRepository extends JpaRepository<DoctorShift, UUID> {

    List<DoctorShift> findByDoctorId(UUID doctorId);

    void deleteByDoctorId(UUID doctorId);
}
