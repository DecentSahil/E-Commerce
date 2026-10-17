# Notification Service

Real-time in-app notification and email dispatch microservice. Ingests events asynchronously from Kafka topics and manages customer in-app alerts and notifications.

## Features
- **Multi-Topic Kafka Ingestion**:
  - Listens to `otp-events`: Dispatches transactional OTP email notifications.
  - Listens to `auth-events`: Welcomes new users and alerts on role/seller status updates.
  - Listens to `order-events`: Alerts customers on `ORDER_CREATED`, `ORDER_CONFIRMED`, `ORDER_STATUS_CHANGED`, `ORDER_CANCELLED`, `ORDER_DELIVERED`, and `ORDER_REFUNDED`.
- **In-App Notification Center**:
  - Unread count endpoint (`GET /api/v1/notifications/unread-count`) optimized for UI bell badges with 30-sec polling.
  - Mark individual notifications as read (`PATCH /api/v1/notifications/{id}/read`).
  - Bulk mark all notifications as read (`PATCH /api/v1/notifications/read-all`).

## API Endpoints
| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/notifications` | Authenticated | List user notifications (params: `unreadOnly`, `page`, `size`) |
| `GET` | `/api/v1/notifications/unread-count` | Authenticated | Get current unread notification count |
| `PATCH` | `/api/v1/notifications/{id}/read` | Authenticated | Mark specific notification as read |
| `PATCH` | `/api/v1/notifications/read-all` | Authenticated | Mark all notifications as read |

## Tech Stack
- Java 21, Spring Boot 3.4.1
- Spring Data JPA, PostgreSQL (`ecommerce_notification_db`)
- Apache Kafka (`otp-events`, `auth-events`, `order-events`)

## Running Locally
```bash
mvn clean spring-boot:run
```
