package com.example.auth.service;


public interface OtpService {

    String generateAndStoreOtp(String email);

    void verifyOtp(String email, String otp);
}