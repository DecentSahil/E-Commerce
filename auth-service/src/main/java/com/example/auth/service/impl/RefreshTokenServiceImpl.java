package com.example.auth.service.impl;

import com.example.auth.config.JwtProperties;
import com.example.auth.entity.RefreshToken;
import com.example.auth.entity.UserAuth;
import com.example.auth.exception.TokenRefreshException;
import com.example.auth.repository.RefreshTokenRepository;
import com.example.auth.service.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenServiceImpl implements RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtProperties jwtProperties;
    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    @Transactional
    public String createRefreshToken(UserAuth user) {

        log.debug(
                "Creating refresh token | userId={}",
                user.getId()
        );

        String rawToken = generateSecureRandomToken();
        String tokenHash = hashToken(rawToken);

        Instant expiresAt = Instant.now()
                .plusMillis(
                        jwtProperties.getRefreshTokenExpirationMs()
                );

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(expiresAt)
                .revoked(false)
                .build();

        refreshTokenRepository.save(refreshToken);

        log.info(
                "Refresh token created successfully | userId={} | expiresAt={}",
                user.getId(),
                expiresAt
        );

        return rawToken;
    }

    @Override
    @Transactional
    public RotatedTokenResult verifyAndRotateRefreshToken(
            String rawToken
    ) {

        log.debug("Refresh token verification started");

        String tokenHash = hashToken(rawToken);

        RefreshToken existingToken =
                refreshTokenRepository.findByTokenHash(tokenHash)
                        .orElseThrow(() -> {
                            log.warn(
                                    "Refresh token verification failed: token not recognized"
                            );

                            return new TokenRefreshException(
                                    "Refresh token was not recognized"
                            );
                        });

        UserAuth user = existingToken.getUser();

        // Check if token was already revoked
        if (existingToken.isRevoked()) {

            log.warn(
                    "Revoked refresh token reuse detected | userId={} | revoking all sessions",
                    user.getId()
            );

            refreshTokenRepository.revokeAllUserTokens(
                    user,
                    Instant.now()
            );

            throw new TokenRefreshException(
                    "Refresh token was revoked. Please log in again."
            );
        }

        // Check expiration
        if (existingToken.isExpired()) {

            log.warn(
                    "Expired refresh token used | userId={}",
                    user.getId()
            );

            existingToken.setRevoked(true);
            existingToken.setRevokedAt(Instant.now());

            refreshTokenRepository.save(existingToken);

            throw new TokenRefreshException(
                    "Refresh token has expired. Please log in again."
            );
        }

        // Check account status
        if (!user.getAccountStatus().isActive()) {

            log.warn(
                    "Refresh token rejected: account is not active | userId={} | status={}",
                    user.getId(),
                    user.getAccountStatus()
            );

            throw new TokenRefreshException(
                    "User account is locked or disabled."
            );
        }

        String newRawToken = generateSecureRandomToken();
        String newTokenHash = hashToken(newRawToken);
        Instant now = Instant.now();

        existingToken.setRevoked(true);
        existingToken.setRevokedAt(now);
        existingToken.setReplacedByTokenHash(newTokenHash);

        refreshTokenRepository.save(existingToken);

        RefreshToken newRefreshToken =
                RefreshToken.builder()
                        .user(user)
                        .tokenHash(newTokenHash)
                        .expiresAt(
                                now.plusMillis(
                                        jwtProperties
                                                .getRefreshTokenExpirationMs()
                                )
                        )
                        .revoked(false)
                        .build();

        refreshTokenRepository.save(newRefreshToken);

        log.info(
                "Refresh token rotated successfully | userId={}",
                user.getId()
        );

        return new RotatedTokenResult(
                newRawToken,
                user
        );
    }

    @Override
    @Transactional
    public void revokeRefreshToken(String rawToken) {

        if (rawToken == null || rawToken.isBlank()) {
            log.debug("Refresh token revocation skipped: token is empty");
            return;
        }

        String tokenHash = hashToken(rawToken);

        refreshTokenRepository.findByTokenHash(tokenHash)
                .ifPresentOrElse(
                        token -> {

                            token.setRevoked(true);
                            token.setRevokedAt(Instant.now());

                            refreshTokenRepository.save(token);

                            log.info(
                                    "Refresh token revoked successfully | userId={}",
                                    token.getUser().getId()
                            );
                        },
                        () -> log.debug(
                                "Refresh token revocation skipped: token not found"
                        )
                );
    }

    @Override
    @Transactional
    public void revokeAllUserTokens(UserAuth user) {

        log.info(
                "Revoking all refresh tokens | userId={}",
                user.getId()
        );

        refreshTokenRepository.revokeAllUserTokens(
                user,
                Instant.now()
        );

        log.info(
                "All refresh tokens revoked successfully | userId={}",
                user.getId()
        );
    }

    private String generateSecureRandomToken() {

        byte[] randomBytes = new byte[64];

        secureRandom.nextBytes(randomBytes);

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(randomBytes);
    }

    private String hashToken(String rawToken) {

        try {

            MessageDigest digest =
                    MessageDigest.getInstance("SHA-256");

            byte[] hash = digest.digest(
                    rawToken.getBytes(StandardCharsets.UTF_8)
            );

            return HexFormat.of().formatHex(hash);

        } catch (NoSuchAlgorithmException e) {

            throw new IllegalStateException(
                    "SHA-256 algorithm not available",
                    e
            );
        }
    }
}