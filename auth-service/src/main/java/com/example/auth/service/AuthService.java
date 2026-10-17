package com.example.auth.service;

import com.example.auth.dto.request.*;
import com.example.auth.dto.response.AuthResponse;
import com.example.auth.dto.response.MessageResponse;
import com.example.auth.entity.Role;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import com.example.auth.dto.response.UserResponse;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    MessageResponse registerSeller(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    @Transactional
    AuthResponse loginWithOtp(OtpLoginRequest request);

    AuthResponse refreshToken(RefreshTokenRequest request);

    void logout(String refreshToken);

    UserResponse getCurrentUser(String email);

    void sendOtp(SendOtpRequest request);

    UserResponse updateUserRole(UUID userId, Role newRole);

    List<UserResponse> getPendingSellers();

    UserResponse approveSeller(UUID userId);

    UserResponse rejectSeller(UUID userId);
}
