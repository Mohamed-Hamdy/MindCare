package com.mindcare.backend.security;

import com.mindcare.backend.domain.User;
import com.mindcare.backend.domain.UserRole;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Plain unit test — no Spring context or database needed, so it also works
 * as a quick sanity check that the JJWT wiring (pom.xml version, API usage)
 * is correct: run with `mvn -pl . test -Dtest=JwtServiceTest`.
 */
class JwtServiceTest {

    private final JwtService jwtService =
            new JwtService("unit-test-secret-key-must-be-at-least-32-bytes-long", 60);

    @Test
    void generatesAndParsesAValidToken() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setUsername("admin");
        user.setPasswordHash("irrelevant-for-this-test");
        user.setRole(UserRole.ADMIN);
        user.setActive(true);

        AppUserPrincipal principal = new AppUserPrincipal(user);
        String token = jwtService.generateToken(principal);

        assertThat(token).isNotBlank();
        assertThat(jwtService.extractUsername(token)).contains("admin");
        assertThat(jwtService.extractUserId(token)).contains(user.getId());
    }

    @Test
    void rejectsATamperedToken() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setUsername("admin");
        user.setPasswordHash("irrelevant-for-this-test");
        user.setRole(UserRole.ADMIN);
        user.setActive(true);

        String token = jwtService.generateToken(new AppUserPrincipal(user));
        String tampered = token.substring(0, token.length() - 2) + "xx";

        assertThat(jwtService.parseClaims(tampered)).isEmpty();
    }
}
