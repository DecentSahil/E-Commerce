package com.example.auth.service;

import com.example.auth.dto.request.*;
import com.example.auth.dto.response.AuthResponse;
import com.example.auth.dto.response.UserResponse;
import org.springframework.transaction.annotation.Transactional;

public interface AuthService {


    AuthResponse register(RegisterRequest request);


    AuthResponse login(LoginRequest request);

    @Transactional
    AuthResponse loginWithOtp(OtpLoginRequest request);

    AuthResponse refreshToken(RefreshTokenRequest request);

    void logout(String refreshToken);

    UserResponse getCurrentUser(String email);

    void sendOtp(SendOtpRequest request);
}
