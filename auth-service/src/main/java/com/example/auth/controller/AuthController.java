package com.example.auth.controller;

import com.example.auth.dto.request.*;
import com.example.auth.dto.response.AuthResponse;
import com.example.auth.dto.response.MessageResponse;
import com.example.auth.dto.response.UserResponse;
import com.example.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/send-otp")
    public ResponseEntity<String> sendOtp(
            @Valid @RequestBody SendOtpRequest request) {

        authService.sendOtp(request);

        return ResponseEntity.ok("OTP sent successfully");
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/otp/login")
    public AuthResponse loginWithOtp(
            @RequestBody OtpLoginRequest request) {

        return authService.loginWithOtp(request);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<MessageResponse> logout(@RequestBody(required = false) RefreshTokenRequest request) {
        String token = (request != null) ? request.getRefreshToken() : null;
        authService.logout(token);
        return ResponseEntity.ok(new MessageResponse("Successfully logged out and session revoked."));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        UserResponse userResponse = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(userResponse);
    }

}
