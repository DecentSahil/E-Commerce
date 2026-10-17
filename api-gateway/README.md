# API Gateway

[![Spring Cloud Gateway](https://img.shields.io/badge/Spring%20Cloud%20Gateway-2024.0.0-blue.svg)](https://spring.io/projects/spring-cloud-gateway)
[![Project Reactor](https://img.shields.io/badge/Reactor-Netty-brightgreen.svg)](https://projectreactor.io/)
[![Redis Rate Limiter](https://img.shields.io/badge/Redis-RateLimiter-red.svg)](https://redis.io/)

Reactive, non-blocking edge gateway built on **Spring Cloud Gateway** and **Project Reactor (Netty)**. Acts as the single entry point for all frontend and mobile client traffic, managing cross-cutting concerns: dynamic service discovery routing, CORS negotiation, JWT authentication, downstream header propagation, and distributed Redis rate limiting.

---

## 1. Core Architectural Responsibilities

1. **Dynamic Service Discovery Routing**: Routes incoming requests to backend microservices registered with Eureka using `lb://<service-name>` with client-side load balancing.
2. **JWT Authentication & Downstream Header Propagation**:
   - Inspects the HTTP `Authorization: Bearer <jwt>` header on protected routes.
   - Decodes claims statelessly without calling `auth-service`.
   - Injects normalized HTTP headers for downstream microservices:
     - `X-User-Id`: Authenticated user UUID.
     - `X-User-Email`: User's email address.
     - `X-User-Role`: Standardized role (`ROLE_CUSTOMER`, `ROLE_SELLER`, `ROLE_ADMIN`).
3. **Distributed Token-Bucket Rate Limiting (Redis)**:
   - **Auth Endpoints** (`/api/v1/auth/login`, `/otp/send`, `/otp/login`): Restricted via `IpKeyResolver` (5 requests/sec, burst capacity of 10) to defend against brute-force credential stuffing and SMS/Email OTP flooding.
   - **General API Endpoints** (`/cart/**`, `/orders/**`, `/products/**`, `/users/**`): Enforced via `UserKeyResolver` (50 requests/sec, burst capacity of 100) using authenticated `X-User-Id` (falling back to remote IP for unauthenticated routes).
4. **Global CORS Negotiation**:
   - Allows origins configured via environment variables (defaults to `http://localhost:3000`).
   - Supports `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `OPTIONS` with `Allow-Credentials: true`.

---

## 2. Gateway Routing Matrix

| Route ID | Predicate Path | Target Service | Rate Limit Policy |
|---|---|---|---|
| `auth-service-auth` | `/api/v1/auth/**` | `lb://auth-service` | `IpKeyResolver` (5 req/s, burst 10) |
| `user-service` | `/api/v1/users/**` | `lb://user-service` | `UserKeyResolver` (50 req/s, burst 100) |
| `product-service-products` | `/api/v1/products/**` | `lb://product-service` | `UserKeyResolver` (50 req/s, burst 100) |
| `product-service-listings` | `/api/v1/listings/**` | `lb://product-service` | `UserKeyResolver` (50 req/s, burst 100) |
| `product-service-categories`| `/api/v1/categories/**` | `lb://product-service` | Public Cacheable |
| `product-service-brands` | `/api/v1/brands/**` | `lb://product-service` | Public Cacheable |
| `cart-service` | `/api/v1/cart/**` | `lb://cart-service` | `UserKeyResolver` (50 req/s, burst 100) |
| `order-service` | `/api/v1/orders/**` | `lb://order-service` | `UserKeyResolver` (50 req/s, burst 100) |
| `wishlist-service` | `/api/v1/wishlist/**` | `lb://wishlist-service` | `UserKeyResolver` (50 req/s, burst 100) |
| `notification-service` | `/api/v1/notifications/**` | `lb://notification-service` | `UserKeyResolver` (50 req/s, burst 100) |

---

## 3. Technology Stack

- **Runtime**: Java 21
- **Framework**: Spring Boot 3.4.1, Spring Cloud Gateway 2024.0.0
- **Web Engine**: Project Reactor & Netty (Non-blocking I/O)
- **Security**: Spring Security Reactive, JJWT (`0.12.6`)
- **Rate Limiting**: Spring Data Redis Reactive (`lettuce`)
- **Service Discovery**: Spring Cloud Netflix Eureka Client

---

## 4. Environment Configuration

| Variable | Default Value | Description |
|---|---|---|
| `SERVER_PORT` | `8080` | Port on which the Gateway listens |
| `SPRING_PROFILES_ACTIVE` | `dev` | Active Spring profile (`dev`, `prod`, `test`) |
| `EUREKA_SERVER_URL` | `http://localhost:8761/eureka/` | Eureka Service Registry endpoint |
| `REDIS_HOST` | `localhost` | Redis instance host for rate limiter |
| `REDIS_PORT` | `6379` | Redis instance port |
| `JWT_SECRET_KEY` | *(Config Server / Vault)* | Base64 HMAC-SHA256 signature verification key |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | Whitelisted frontend origins |

---

## 5. Local Development & Startup

### Prerequisites
- Eureka Service Registry running on port `8761`
- Config Server running on port `8888`
- Redis running on port `6379`

### Run Command
```bash
mvn clean spring-boot:run
```

Verify health and registered routes:
```bash
curl http://localhost:8080/actuator/health
```
