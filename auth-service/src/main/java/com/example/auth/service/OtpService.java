package com.example.auth.service;


public interface OtpService {

    void generateAndStoreOtp(String email);

    void verifyOtp(String email, String otp);
}