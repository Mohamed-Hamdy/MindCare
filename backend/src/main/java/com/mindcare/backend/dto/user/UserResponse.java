package com.mindcare.backend.dto.user;

import com.mindcare.backend.domain.User;

import java.util.UUID;

public record UserResponse(
        UUID id,
        String fullName,
        String username,
        String role,
        UUID linkedDoctorId,
        boolean active
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getUsername(),
                user.getRole().name(),
                user.getLinkedDoctor() != null ? user.getLinkedDoctor().getId() : null,
                user.isActive()
        );
    }
}
