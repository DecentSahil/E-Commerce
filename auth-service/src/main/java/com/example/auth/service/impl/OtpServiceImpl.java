package com.example.auth.service.impl;

import com.example.auth.service.OtpService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpServiceImpl implements OtpService {

    private final StringRedisTemplate redisTemplate;

    private static final long OTP_EXPIRY_MINUTES = 5;

    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    public void generateAndStoreOtp(String email) {

        String otp = String.format(
                "%06d",
                secureRandom.nextInt(1_000_000)
        );

        String key = "otp:" + email;

        redisTemplate.opsForValue().set(
                key,
                otp,
                Duration.ofMinutes(OTP_EXPIRY_MINUTES)
        );

        // Later: replace this log with your actual email/SMS sending service.
        log.info("OTP generated and stored | email={} | expiresInMinutes={}",
                email,
                OTP_EXPIRY_MINUTES);
    }

    @Override
    public void verifyOtp(String email, String otp) {

        String key = "otp:" + email;

        String storedOtp =
                redisTemplate.opsForValue().get(key);

        if (storedOtp == null) {
            log.warn("OTP verification failed: OTP expired or not found | email={}",
                    email);

            throw new RuntimeException("OTP expired or not found");
        }

        if (!storedOtp.equals(otp)) {
            log.warn("OTP verification failed: invalid OTP | email={}",
                    email);

            throw new RuntimeException("Invalid OTP");
        }

        redisTemplate.delete(key);

        log.info("OTP verified successfully | email={}", email);
    }
}