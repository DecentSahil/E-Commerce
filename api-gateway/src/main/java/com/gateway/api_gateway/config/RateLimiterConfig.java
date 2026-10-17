package com.gateway.api_gateway.config;

import org.springframework.cloud.gateway.filter.ratelimit.RedisRateLimiter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class RateLimiterConfig {

    /**
     * Rate limiter for sensitive authentication operations (login, OTP send, OTP login).
     * replenishRate: 5 requests per second
     * burstCapacity: 10 requests
     * requestedTokens: 1
     */
    @Bean("authRateLimiter")
    public RedisRateLimiter authRateLimiter() {
        return new RedisRateLimiter(5, 10, 1);
    }

    /**
     * Standard rate limiter for general platform endpoints (products, cart, orders, users, etc.).
     * replenishRate: 50 requests per second
     * burstCapacity: 100 requests
     * requestedTokens: 1
     */
    @Bean("generalRateLimiter")
    @Primary
    public RedisRateLimiter generalRateLimiter() {
        return new RedisRateLimiter(50, 100, 1);
    }
}
