package com.mindcare.backend.repository;

import com.mindcare.backend.domain.Appointment;
import com.mindcare.backend.domain.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {

    List<Appointment> findByDoctorIdAndDate(UUID doctorId, LocalDate date);

    List<Appointment> findByDoctorId(UUID doctorId);

    List<Appointment> findByPatientId(UUID patientId);

    List<Appointment> findByDateAndStatusIn(LocalDate date, List<AppointmentStatus> statuses);

    @Query("""
        SELECT a FROM Appointment a
        WHERE a.doctor.id = :doctorId
          AND a.date = :date
          AND a.status <> com.mindcare.backend.domain.AppointmentStatus.CANCELLED
          AND a.startTime < :endTime
          AND a.endTime > :startTime
        """)
    List<Appointment> findOverlapping(@Param("doctorId") UUID doctorId,
                                       @Param("date") LocalDate date,
                                       @Param("startTime") LocalTime startTime,
                                       @Param("endTime") LocalTime endTime);
}
