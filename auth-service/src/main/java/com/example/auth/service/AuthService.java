package com.example.auth.service;

import com.example.auth.dto.request.LoginRequest;
import com.example.auth.dto.request.OtpLoginRequest;
import com.example.auth.dto.request.RefreshTokenRequest;
import com.example.auth.dto.request.RegisterRequest;
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
}
