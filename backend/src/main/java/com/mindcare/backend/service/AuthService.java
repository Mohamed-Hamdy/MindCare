package com.mindcare.backend.service;

import com.mindcare.backend.domain.User;
import com.mindcare.backend.dto.auth.LoginRequest;
import com.mindcare.backend.dto.auth.LoginResponse;
import com.mindcare.backend.dto.user.UserResponse;
import com.mindcare.backend.repository.UserRepository;
import com.mindcare.backend.security.AppUserPrincipal;
import com.mindcare.backend.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    public AuthService(AuthenticationManager authenticationManager, JwtService jwtService, UserRepository userRepository) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );

        User user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found: " + request.username()));

        String token = jwtService.generateToken(new AppUserPrincipal(user));
        return LoginResponse.of(token, UserResponse.from(user));
    }
}
