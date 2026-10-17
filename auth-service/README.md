# Auth Service

Authentication and identity management microservice handling user registration, login, role-based access control, OTP lifecycle, and token issuance.

## Features
- **JWT Token Issuance**: Generates stateless access tokens (HS256) and refresh tokens.
- **Dual Authentication**:
  - Email + Password login with BCrypt hashing.
  - OTP passwordless login with Redis TTL caching and route aliasing (`/send-otp` & `/otp/send`).
- **Seller Onboarding & Approval**:
  - Supports seller registration with `PENDING_APPROVAL` status.
  - Admin endpoints (`POST /api/v1/auth/sellers/{sellerId}/approve`, `reject`) for marketplace seller moderation.
- **Role Standardization**: Emits standardized Spring Security roles (`ROLE_CUSTOMER`, `ROLE_SELLER`, `ROLE_ADMIN`).
- **Post-Commit Kafka Event Publishing**: Dispatches `USER_REGISTERED`, `SELLER_REGISTERED`, `SELLER_APPROVED`, and `OTP_REQUESTED` events.

## API Endpoints
| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Register customer account with verified OTP |
| `POST` | `/api/v1/auth/register-seller` | Public | Register seller account in `PENDING_APPROVAL` status |
| `POST` | `/api/v1/auth/login` | Public | Authenticate with email and password |
| `POST` | `/api/v1/auth/otp/send` | Public | Send 6-digit OTP code to user email |
| `POST` | `/api/v1/auth/otp/login` | Public | Passwordless login via OTP code |
| `POST` | `/api/v1/auth/refresh` | Public | Refresh expired access token using refresh token |
| `POST` | `/api/v1/auth/logout` | Authenticated | Revoke refresh token and invalidate session |
| `GET` | `/api/v1/auth/sellers/pending` | `ROLE_ADMIN` | List pending seller accounts |
| `POST` | `/api/v1/auth/sellers/{id}/approve` | `ROLE_ADMIN` | Approve pending seller account |
| `POST` | `/api/v1/auth/sellers/{id}/reject` | `ROLE_ADMIN` | Reject pending seller account |

## Tech Stack
- Java 21, Spring Boot 3.4.1
- Spring Security, JJWT
- PostgreSQL (`ecommerce_auth_db`)
- Redis (OTP caching & refresh token storage)
- Apache Kafka (`auth-events`, `otp-events`)

## Running Locally
```bash
mvn clean spring-boot:run
```
