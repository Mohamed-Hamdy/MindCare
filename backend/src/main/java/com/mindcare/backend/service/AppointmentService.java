package com.mindcare.backend.service;

import com.mindcare.backend.common.ApiException;
import com.mindcare.backend.domain.*;
import com.mindcare.backend.dto.appointment.AppointmentRequest;
import com.mindcare.backend.repository.AppointmentRepository;
import com.mindcare.backend.repository.DoctorRepository;
import com.mindcare.backend.repository.DoctorShiftRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional
public class AppointmentService {

    private static final Set<AppointmentStatus> ACTIVE_QUEUE_STATUSES =
            Set.of(AppointmentStatus.WAITING, AppointmentStatus.IN_EXAM,
                    AppointmentStatus.COMPLETED, AppointmentStatus.EMERGENCY);

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final DoctorShiftRepository doctorShiftRepository;
    private final PatientService patientService;

    public AppointmentService(AppointmentRepository appointmentRepository,
                               DoctorRepository doctorRepository,
                               DoctorShiftRepository doctorShiftRepository,
                               PatientService patientService) {
        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
        this.doctorShiftRepository = doctorShiftRepository;
        this.patientService = patientService;
    }

    @Transactional(readOnly = true)
    public List<Appointment> findAll(UUID doctorId, LocalDate date) {
        if (doctorId != null && date != null) {
            return appointmentRepository.findByDoctorIdAndDate(doctorId, date);
        }
        if (doctorId != null) {
            return appointmentRepository.findByDoctorId(doctorId);
        }
        if (date != null) {
            return appointmentRepository.findByDateAndStatusIn(date, List.of(AppointmentStatus.values()));
        }
        return appointmentRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Appointment findById(UUID id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Appointment not found: " + id));
    }

    /**
     * Books a new appointment. The slot's end time and duration are derived from the
     * doctor's weekly shift that covers {@code startTime} on that day of week — the same
     * "smart slot" rule the Angular patient portal enforces client-side.
     *
     * <p>Note: this MVP skips the client-side-only build's email-OTP confirmation step
     * (there is no email provider wired into the backend yet) — appointments booked
     * through this API are created directly as {@code CONFIRMED}. Front-desk staff can
     * still walk a booking through WAITING → IN_EXAM → COMPLETED as usual.
     */
    public Appointment book(AppointmentRequest request) {
        Doctor doctor = doctorRepository.findById(request.doctorId())
                .orElseThrow(() -> ApiException.badRequest("Unknown doctorId: " + request.doctorId()));

        if (!doctor.isActive()) {
            throw ApiException.badRequest("Doctor is not currently accepting appointments");
        }

        int dayOfWeek = request.date().getDayOfWeek().getValue() % 7; // Angular convention: 0=Sunday..6=Saturday
        List<DoctorShift> shifts = doctorShiftRepository.findByDoctorId(doctor.getId());

        DoctorShift matchingShift = shifts.stream()
                .filter(s -> s.getDayOfWeek() == dayOfWeek)
                .filter(s -> !request.startTime().isBefore(s.getStartTime()) && request.startTime().isBefore(s.getEndTime()))
                .findFirst()
                .orElseThrow(() -> ApiException.badRequest(
                        "The doctor has no shift covering " + request.startTime() + " on that day"));

        LocalTime endTime = request.startTime().plusMinutes(matchingShift.getSlotDurationMinutes());

        List<Appointment> overlapping = appointmentRepository.findOverlapping(
                doctor.getId(), request.date(), request.startTime(), endTime);
        if (!overlapping.isEmpty()) {
            throw ApiException.conflict("That slot is already booked for this doctor");
        }

        Patient patient = resolvePatient(request);

        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setSpecialty(doctor.getSpecialty());
        appointment.setDate(request.date());
        appointment.setStartTime(request.startTime());
        appointment.setEndTime(endTime);
        appointment.setReasonForVisit(request.reasonForVisit());
        appointment.setEmergency(request.emergency());
        appointment.setStatus(request.emergency() ? AppointmentStatus.EMERGENCY : AppointmentStatus.CONFIRMED);

        if (request.emergency()) {
            appointment.setQueueNumber(nextQueueNumber(doctor.getId(), request.date(), true));
            appointment.setCheckedInAt(Instant.now());
        }

        return appointmentRepository.save(appointment);
    }

    public Appointment updateStatus(UUID id, AppointmentStatus newStatus) {
        Appointment appointment = findById(id);
        Instant now = Instant.now();

        switch (newStatus) {
            case WAITING -> {
                appointment.setCheckedInAt(now);
                appointment.setQueueNumber(nextQueueNumber(appointment.getDoctor().getId(), appointment.getDate(), false));
            }
            case IN_EXAM -> appointment.setStartedAt(now);
            case COMPLETED -> appointment.setCompletedAt(now);
            case EMERGENCY -> {
                appointment.setEmergency(true);
                appointment.setCheckedInAt(now);
                appointment.setQueueNumber(nextQueueNumber(appointment.getDoctor().getId(), appointment.getDate(), true));
            }
            case CANCELLED, CONFIRMED, PENDING_OTP -> {
                // no derived fields to set
            }
        }

        appointment.setStatus(newStatus);
        return appointmentRepository.save(appointment);
    }

    private Patient resolvePatient(AppointmentRequest request) {
        if (request.patientId() != null) {
            return patientService.findById(request.patientId());
        }
        if (request.newPatient() != null) {
            var np = request.newPatient();
            return patientService.findOrCreate(np.fullName(), np.phone(), np.email(), np.gender());
        }
        throw ApiException.badRequest("Either patientId or newPatient must be provided");
    }

    private int nextQueueNumber(UUID doctorId, LocalDate date, boolean emergency) {
        List<Appointment> todaysQueue = appointmentRepository.findByDoctorIdAndDate(doctorId, date).stream()
                .filter(a -> ACTIVE_QUEUE_STATUSES.contains(a.getStatus()))
                .filter(a -> a.getQueueNumber() != null)
                .sorted(Comparator.comparing(Appointment::getQueueNumber))
                .toList();

        if (emergency) {
            // Emergencies jump the queue: take the lowest active number and go one lower (min 1).
            int lowest = todaysQueue.stream().mapToInt(Appointment::getQueueNumber).min().orElse(1);
            return Math.max(1, lowest - 1);
        }

        return todaysQueue.stream().mapToInt(Appointment::getQueueNumber).max().orElse(0) + 1;
    }
}
