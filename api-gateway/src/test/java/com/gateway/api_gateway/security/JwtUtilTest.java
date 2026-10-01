package com.gateway.api_gateway.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtUtilTest {

    private JwtUtil jwtUtil;
    private final String secretKey = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    private SecretKey signingKey;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", secretKey);
        jwtUtil.init();

        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    @Test
    @DisplayName("shouldParseValidTokenSuccessfully")
    void shouldParseValidTokenSuccessfully() {
        String userId = UUID.randomUUID().toString();
        String token = Jwts.builder()
                .subject("user@example.com")
                .claim("userId", userId)
                .claim("role", "ROLE_USER")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(signingKey)
                .compact();

        Claims claims = jwtUtil.parseToken(token);

        assertThat(claims).isNotNull();
        assertThat(claims.getSubject()).isEqualTo("user@example.com");
        assertThat(claims.get("userId", String.class)).isEqualTo(userId);
        assertThat(claims.get("role", String.class)).isEqualTo("ROLE_USER");
    }

    @Test
    @DisplayName("shouldThrowExceptionWhenTokenIsInvalidOrMalformed")
    void shouldThrowExceptionWhenTokenIsInvalidOrMalformed() {
        assertThatThrownBy(() -> jwtUtil.parseToken("invalid.token.here"))
                .isInstanceOf(Exception.class);
    }
}
