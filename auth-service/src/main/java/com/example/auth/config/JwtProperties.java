package com.example.auth.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.annotation.Validated;

@Getter
@Setter
@Validated
@Configuration
@ConfigurationProperties(prefix = "application.security.jwt")
public class JwtProperties {


    @NotBlank(message = "JWT secret key must not be blank")
    private String secretKey;

    @NotNull(message = "JWT access token expiration must be configured")
    @Positive(message = "JWT access token expiration must be positive")
    private Long accessTokenExpirationMs;

    @NotNull(message = "JWT refresh token expiration must be configured")
    @Positive(message = "JWT refresh token expiration must be positive")
    private Long refreshTokenExpirationMs;

    @NotBlank(message = "JWT issuer must not be blank")
    private String issuer;
}
