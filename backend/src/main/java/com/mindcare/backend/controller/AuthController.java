package com.mindcare.backend.controller;

import com.mindcare.backend.dto.auth.LoginRequest;
import com.mindcare.backend.dto.auth.LoginResponse;
import com.mindcare.backend.dto.user.UserResponse;
import com.mindcare.backend.repository.UserRepository;
import com.mindcare.backend.security.AppUserPrincipal;
import com.mindcare.backend.service.AuthService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    public AuthController(AuthService authService, UserRepository userRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    @SecurityRequirement(name = "")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal AppUserPrincipal principal) {
        return userRepository.findById(principal.getId())
                .map(UserResponse::from)
                .orElseThrow();
    }
}
