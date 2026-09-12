package com.example.auth.service;

import com.example.auth.entity.UserAuth;

public interface RefreshTokenService {

    String createRefreshToken(UserAuth user);

    RotatedTokenResult verifyAndRotateRefreshToken(String rawToken);

    void revokeRefreshToken(String rawToken);

    void revokeAllUserTokens(UserAuth user);

    record RotatedTokenResult(String newRawToken, UserAuth user) {}
}
