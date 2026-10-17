# API Gateway

Reactive, non-blocking edge gateway built on Spring Cloud Gateway and Project Reactor. Serves as the single unified entry point for all frontend and client HTTP traffic, handling CORS, JWT authentication, and header enrichment.

## Features
- **Unified Reverse Proxy**: Routes all `/api/v1/**` requests to backend services registered in Eureka.
- **Global CORS Filter**: Configured for cross-origin requests from the React frontend (`http://localhost:3000`).
- **JWT Authentication & Header Propagation**:
  - Validates incoming `Authorization: Bearer <token>` headers.
  - Automatically enriches downstream requests with authenticated identity headers:
    - `X-User-Id`: Extracted user UUID
    - `X-User-Email`: Extracted user email
    - `X-User-Role`: Standardized authority (`ROLE_CUSTOMER`, `ROLE_SELLER`, `ROLE_ADMIN`)
- **Redis Request Rate Limiting (`RequestRateLimiter`)**:
  - Strict Token Bucket limiting on sensitive auth endpoints (`/login`, `/otp/send`, `/otp/login`): 5 req/s, burst 10 via `IpKeyResolver`.
  - General rate limiting across all other APIs (`/cart`, `/orders`, `/products`, `/users`, etc.): 50 req/s, burst 100 via `UserKeyResolver`.

## Routing Table
| Route ID | Predicate Path | Target Service |
|---|---|---|
| `auth-service` | `/api/v1/auth/**` | `lb://auth-service` |
| `user-service` | `/api/v1/users/**` | `lb://user-service` |
| `product-service-products` | `/api/v1/products/**` | `lb://product-service` |
| `product-service-listings` | `/api/v1/listings/**` | `lb://product-service` |
| `product-service-categories` | `/api/v1/categories/**` | `lb://product-service` |
| `product-service-brands` | `/api/v1/brands/**` | `lb://product-service` |
| `cart-service` | `/api/v1/cart/**` | `lb://cart-service` |
| `order-service` | `/api/v1/orders/**` | `lb://order-service` |
| `wishlist-service` | `/api/v1/wishlist/**` | `lb://wishlist-service` |
| `notification-service` | `/api/v1/notifications/**` | `lb://notification-service` |

## Tech Stack
- Java 21
- Spring Boot 3.4.1
- Spring Cloud Gateway 2024.0.0 (Reactive Netty)
- Spring Security (Reactive) + JJWT

## Default Port
- Port: `8080` (or `8081` when configured)

## Running Locally
```bash
mvn clean spring-boot:run
```
