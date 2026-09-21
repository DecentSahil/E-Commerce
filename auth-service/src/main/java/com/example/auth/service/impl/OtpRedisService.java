package com.example.auth.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class OtpRedisService {

    private final RedisTemplate<String, String> redisTemplate;

    private static final String OTP_PREFIX = "OTP:";
    private static final long OTP_EXPIRY_MINUTES = 5;

    public void saveOtp(String email, String otp) {

        String key = OTP_PREFIX + email;

        redisTemplate.opsForValue().set(
                key,
                otp,
                Duration.ofMinutes(OTP_EXPIRY_MINUTES)
        );
    }

    public String getOtp(String email) {

        return redisTemplate.opsForValue()
                .get(OTP_PREFIX + email);
    }

    public void deleteOtp(String email) {

        redisTemplate.delete(OTP_PREFIX + email);
    }

    public void verifyOtp(String email, String otp) {

        String storedOtp = getOtp(email);

        if (storedOtp == null) {
            throw new IllegalArgumentException("OTP expired or not found");
        }

        if (!storedOtp.equals(otp)) {
            throw new IllegalArgumentException("Invalid OTP");
        }

        deleteOtp(email);
    }
}