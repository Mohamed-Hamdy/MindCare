package com.mindcare.backend.service;

import com.mindcare.backend.common.ApiException;
import com.mindcare.backend.domain.Doctor;
import com.mindcare.backend.domain.User;
import com.mindcare.backend.domain.UserRole;
import com.mindcare.backend.dto.user.UserCreateRequest;
import com.mindcare.backend.dto.user.UserUpdateRequest;
import com.mindcare.backend.repository.DoctorRepository;
import com.mindcare.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class UserAdminService {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final PasswordEncoder passwordEncoder;

    public UserAdminService(UserRepository userRepository, DoctorRepository doctorRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<User> findAll() {
        return userRepository.findAll();
    }

    @Transactional(readOnly = true)
    public User findById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("User not found: " + id));
    }

    public User create(UserCreateRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw ApiException.conflict("Username already taken: " + request.username());
        }

        User user = new User();
        user.setFullName(request.fullName());
        user.setUsername(request.username());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(parseRole(request.role()));
        user.setActive(true);

        if (request.linkedDoctorId() != null) {
            user.setLinkedDoctor(findDoctor(request.linkedDoctorId()));
        }

        return userRepository.save(user);
    }

    public User update(UUID id, UserUpdateRequest request) {
        User user = findById(id);
        user.setFullName(request.fullName());
        user.setActive(request.active());

        if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }

        user.setLinkedDoctor(request.linkedDoctorId() != null ? findDoctor(request.linkedDoctorId()) : null);

        return userRepository.save(user);
    }

    public void delete(UUID id) {
        User user = findById(id);
        userRepository.delete(user);
    }

    private Doctor findDoctor(UUID id) {
        return doctorRepository.findById(id)
                .orElseThrow(() -> ApiException.badRequest("Unknown linkedDoctorId: " + id));
    }

    private UserRole parseRole(String value) {
        try {
            return UserRole.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw ApiException.badRequest("Invalid role: " + value);
        }
    }
}
