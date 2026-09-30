package com.mindcare.backend.service;

import com.mindcare.backend.common.ApiException;
import com.mindcare.backend.domain.Doctor;
import com.mindcare.backend.domain.DoctorShift;
import com.mindcare.backend.domain.Gender;
import com.mindcare.backend.domain.Specialty;
import com.mindcare.backend.dto.doctor.DoctorRequest;
import com.mindcare.backend.dto.doctor.ShiftDto;
import com.mindcare.backend.repository.DoctorRepository;
import com.mindcare.backend.repository.SpecialtyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final SpecialtyRepository specialtyRepository;

    public DoctorService(DoctorRepository doctorRepository, SpecialtyRepository specialtyRepository) {
        this.doctorRepository = doctorRepository;
        this.specialtyRepository = specialtyRepository;
    }

    @Transactional(readOnly = true)
    public List<Doctor> findAll(UUID specialtyId, Boolean activeOnly) {
        List<Doctor> doctors = specialtyId != null
                ? doctorRepository.findBySpecialtyId(specialtyId)
                : doctorRepository.findAll();

        if (Boolean.TRUE.equals(activeOnly)) {
            return doctors.stream().filter(Doctor::isActive).toList();
        }
        return doctors;
    }

    @Transactional(readOnly = true)
    public Doctor findById(UUID id) {
        return doctorRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Doctor not found: " + id));
    }

    public Doctor create(DoctorRequest request) {
        Doctor doctor = new Doctor();
        doctor.setRatingCount(0);
        doctor.setRating(java.math.BigDecimal.ZERO);
        apply(doctor, request);
        return doctorRepository.save(doctor);
    }

    public Doctor update(UUID id, DoctorRequest request) {
        Doctor doctor = findById(id);
        apply(doctor, request);
        return doctorRepository.save(doctor);
    }

    public void delete(UUID id) {
        Doctor doctor = findById(id);
        doctorRepository.delete(doctor);
    }

    private void apply(Doctor doctor, DoctorRequest request) {
        Specialty specialty = specialtyRepository.findById(request.specialtyId())
                .orElseThrow(() -> ApiException.badRequest("Unknown specialtyId: " + request.specialtyId()));

        doctor.setFullName(request.fullName());
        doctor.setGender(parseGender(request.gender()));
        doctor.setSpecialty(specialty);
        doctor.setTitle(request.title());
        doctor.setBio(request.bio());
        doctor.setAvatarColor(request.avatarColor());
        doctor.setConsultationFee(request.consultationFee());
        doctor.setYearsExperience(request.yearsExperience());
        doctor.setActive(request.active());

        if (request.shifts() != null) {
            doctor.getShifts().clear();
            List<DoctorShift> shifts = new ArrayList<>();
            for (ShiftDto dto : request.shifts()) {
                DoctorShift shift = new DoctorShift();
                shift.setDoctor(doctor);
                shift.setDayOfWeek(dto.dayOfWeek());
                shift.setStartTime(dto.startTime());
                shift.setEndTime(dto.endTime());
                shift.setSlotDurationMinutes(dto.slotDurationMinutes() > 0 ? dto.slotDurationMinutes() : 15);
                shifts.add(shift);
            }
            doctor.getShifts().addAll(shifts);
        }
    }

    private Gender parseGender(String value) {
        try {
            return Gender.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw ApiException.badRequest("Invalid gender: " + value + " (expected MALE or FEMALE)");
        }
    }
}
