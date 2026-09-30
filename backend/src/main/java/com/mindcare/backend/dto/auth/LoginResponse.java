package com.mindcare.backend.dto.auth;

import com.mindcare.backend.dto.user.UserResponse;

public record LoginResponse(
        String token,
        String tokenType,
        UserResponse user
) {
    public static LoginResponse of(String token, UserResponse user) {
        return new LoginResponse(token, "Bearer", user);
    }
}
