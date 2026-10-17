# User Service

User profile and customer address management microservice. Synchronizes user records with `auth-service` via Kafka and provides profile and shipping address management.

## Features
- **Profile Management**:
  - Direct UUID routes (`GET/PUT/PATCH/DELETE /api/v1/users/{authUserId}`).
  - First-class `/me` routes (`GET/PUT/PATCH/DELETE /api/v1/users/me`) using gateway-injected `X-User-Id`.
- **Address Management**:
  - Full address CRUD under `/api/v1/users/addresses`.
  - Dedicated `PATCH /api/v1/users/addresses/{addressId}/default` endpoint.
  - Smart default address lifecycle: automatically marks the first address as default, unsets prior defaults atomically, and promotes the next address upon deletion of the default.
- **Idempotent Kafka Consumer**:
  - Consumes `auth-events` to auto-provision user profiles upon registration with duplicate suppression.

## API Endpoints
| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/users/me` | Authenticated | Retrieve current user's profile |
| `PUT` | `/api/v1/users/me` | Authenticated | Update current user's profile |
| `PATCH` | `/api/v1/users/me` | Authenticated | Partial update current user's profile |
| `DELETE` | `/api/v1/users/me` | Authenticated | Delete current user's profile |
| `GET` | `/api/v1/users/{userId}` | Authenticated | Get profile by auth user ID |
| `GET` | `/api/v1/users/addresses` | Authenticated | List all saved addresses for current user |
| `POST` | `/api/v1/users/addresses` | Authenticated | Add a new address |
| `GET` | `/api/v1/users/addresses/{id}` | Authenticated | Get specific address by ID |
| `PUT` | `/api/v1/users/addresses/{id}` | Authenticated | Update existing address |
| `DELETE` | `/api/v1/users/addresses/{id}` | Authenticated | Delete address with default promotion fallback |
| `PATCH` | `/api/v1/users/addresses/{id}/default` | Authenticated | Set address as primary default |

## Tech Stack
- Java 21, Spring Boot 3.4.1
- Spring Data JPA, PostgreSQL (`ecommerce_user_db`)
- Apache Kafka (`auth-events`)

## Running Locally
```bash
mvn clean spring-boot:run
```
