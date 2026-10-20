# E-Commerce Microservices Platform

[![Java 21](https://img.shields.io/badge/Java-21-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.1-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Spring Cloud](https://img.shields.io/badge/Spring%20Cloud-2024.0.0-blue.svg)](https://spring.io/projects/spring-cloud)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![Kafka](https://img.shields.io/badge/Apache%20Kafka-3.x-black.svg)](https://kafka.apache.org/)
[![Redis](https://img.shields.io/badge/Redis-7-red.svg)](https://redis.io/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)

An enterprise-grade, distributed multi-seller e-commerce platform built with **Java 21**, **Spring Boot 3.4.1**, **Spring Cloud 2024.0.0**, **PostgreSQL**, **Redis**, **Apache Kafka**, and a modern **React** frontend. Engineered following the Database-per-Service pattern, domain-driven design, and post-commit event-driven architecture.

---

## 1. System Architecture

The platform follows a microservices architecture pattern where services communicate synchronously via REST (OpenFeign) through the API Gateway, and asynchronously via Apache Kafka events with post-commit transaction guarantees.

```
[ React 18 Frontend (Port 3000) ]
              │
              ▼
[ API Gateway (Spring Cloud Gateway - Port 8080) ]
              │ (Routes enriched with X-User-Id, X-User-Email, X-User-Role)
    ──────────┼───────────────────────────────────────────────────────────
    │         │            │             │           │           │           │
    ▼         ▼            ▼             ▼           ▼           ▼           ▼
 [auth]     [user]     [product]      [order]    [wishlist]    [cart]   [notification]
(:8081)    (:8082)      (:8083)       (:8084)     (:8086)      (:8087)      (:8090)
    │         │            │             │           │           │           ▲
    └─────────┴────────────┴──────┬──────┴───────────┴───────────┴───────────┘
                                  ▼
                         [ Apache Kafka ]
                   (Topics: auth, otp, order, cart, product, wishlist)
```

---

## 2. Microservice Registry & Port Allocation

| Service | Port | Database | Primary Responsibility |
|---|---|---|---|
| **[Service Registry](service-registry/README.md)** | `8761` | N/A | Eureka discovery server & instance heartbeat tracking |
| **[Config Server](config-server/README.md)** | `8888` | N/A | Centralized Spring Cloud Config Server reading `config-repo/` |
| **[API Gateway](api-gateway/README.md)** | `8080` | Redis (`6379`) | Reactive gateway, CORS, JWT auth, Redis Token-Bucket rate limiting |
| **[Auth Service](auth-service/README.md)** | `8081` | `ecommerce_auth_db` | Authentication, JWT, OTP, seller onboarding & RBAC |
| **[User Service](user-service/README.md)** | `8082` | `ecommerce_user_db` | User profiles (`/me`), address management & default fallback |
| **[Product Service](product-service/README.md)** | `8083` | `ecommerce_product_db` | Products, brands, categories, multi-seller listings & stock |
| **[Order Service](order-service/README.md)** | `8084` | `ecommerce_order_db` | Cart checkout, saga orchestration, multi-role orders & history |
| **[Wishlist Service](wishlist-service/README.md)** | `8086` | `ecommerce_wishlist_db` | Customer saved items & product card check endpoints |
| **[Cart Service](cart-service/README.md)** | `8087` | `ecommerce_cart_db` | Cart management, live product pricing & stock validation |
| **[Notification Service](notification-service/README.md)** | `8090` | `ecommerce_notification_db` | In-app notification center & Kafka event dispatch |

*(Note: `analytics-service` and `recommendation-service` are auxiliary and excluded from the core transaction path).*

---

## 3. Database Architecture & Flyway Migrations

Each microservice maintains its own dedicated PostgreSQL database adhering to the **Database-per-Service** pattern.
- **Automated Flyway Migrations**: Incremental schema migrations are defined under `src/main/resources/db/migration/` (e.g. `V1__init_<service>_schema.sql`). On startup, Flyway automatically executes pending migrations and validates checksums.
- **Schema Validation**: Hibernate is configured with `ddl-auto: validate` across all services. Hibernate verifies that JPA `@Entity` definitions match the Flyway-migrated schema without modifying tables at runtime.
- **Standardized Configuration**: All services standardize on universal environment variables with fallback defaults:
  ```bash
  POSTGRES_HOST=localhost
  POSTGRES_PORT=5432
  POSTGRES_USERNAME=postgres
  POSTGRES_PASSWORD=your_db_password
  ```

---

## 4. Product Image Upload & Storage Architecture

### How Product Images Work
In modern distributed microservices, **binary files should not be stored directly in database BLOB columns or microservice local containers**. Doing so degrades database performance, prevents stateless horizontal scaling, and fills container storage.

Instead, the platform uses an **immutable URL reference model**:
1. In the database, the `products` table stores `image_url VARCHAR(2048)` pointing to an optimized image hosted on a Content Delivery Network (CDN) or Object Storage (such as **Amazon S3**, **Cloudflare R2**, or **Cloudinary**).
2. When creating or updating a product (`POST /api/v1/products` or `PUT /api/v1/products/{id}`), the request accepts an `imageUrl` property.
3. When adding items to cart, wishlist, or checking out an order, `productImageUrl` is snapshotted into `order_items` so that subsequent updates to catalog images do not alter historical order receipts.

### Recommended Production Upload Strategies:
- **Direct-to-S3 Presigned Upload (Recommended for scale)**:
  1. Frontend calls backend to request a signed pre-authenticated upload URL.
  2. Frontend uploads the image directly to S3 / Cloudinary via `PUT / POST`.
  3. Frontend sends the resulting public CDN URL in the `imageUrl` field when creating/updating the product.
- **Local Static File Upload (Alternative for simple self-hosted setups)**:
  - Spring Boot can expose a `POST /api/v1/products/{id}/image` endpoint consuming `multipart/form-data`, saving the file to an external mounted volume (e.g., `/var/ecommerce/uploads`), and serving it via Spring's `ResourceHttpRequestHandler`.

---

## 5. Kafka Event-Driven Architecture

All state mutations dispatch Kafka events using Spring's `TransactionSynchronizationManager.registerSynchronization(afterCommit)` to guarantee that events are published **only after database transactions successfully commit**.

| Kafka Topic | Producer | Consumers | Event Types |
|---|---|---|---|
| `otp-events` | `auth-service` | `notification-service` | `OTP_REQUESTED` |
| `auth-events` | `auth-service` | `user-service`, `notification-service` | `USER_REGISTERED`, `SELLER_REGISTERED`, `SELLER_APPROVED` |
| `order-events` | `order-service` | `notification-service` | `ORDER_CREATED`, `ORDER_CONFIRMED`, `ORDER_STATUS_CHANGED`, `ORDER_CANCELLED`, `ORDER_DELIVERED` |
| `cart-events` | `cart-service` | Analytics / Audit | `CART_UPDATED`, `CART_CLEARED` |
| `wishlist-events` | `wishlist-service` | Analytics / Audit | `WISHLIST_ITEM_ADDED`, `WISHLIST_ITEM_REMOVED` |
| `product-events` | `product-service` | Analytics / Search | `PRODUCT_CREATED`, `LISTING_CREATED`, `STOCK_UPDATED` |

---

## 6. Startup & Execution Guide

### Option A: Docker Compose (Recommended)

Run the entire platform (databases, broker, registry, configuration, gateway, all microservices, and React frontend) using a single command:

1. **Configure Environment:**
   ```bash
   cp .env.example .env
   # Update secrets in .env if running in production
   ```

2. **Launch All Services:**
   ```bash
   docker compose up -d --build
   ```

3. **Verify Health:**
   ```bash
   docker compose ps
   ```
   - **Frontend UI**: [http://localhost:3000](http://localhost:3000)
   - **API Gateway**: [http://localhost:8080](http://localhost:8080)
   - **Eureka Dashboard**: [http://localhost:8761](http://localhost:8761)
   - **Config Server**: [http://localhost:8888](http://localhost:8888)

---

### Option B: Local Development Startup

#### Prerequisites
- **Java 21 JDK** installed
- **Apache Maven 3.9+**
- **PostgreSQL 16** running on port `5432`
- **Redis 7** running on port `6379`
- **Apache Kafka 3.x** running on port `9092`
- **Node.js 18+** & npm for the React frontend

#### Step-by-Step Service Startup Sequence:
To ensure configuration and discovery resolve correctly, start the microservices in the following exact order:

1. **Infrastructure**:
   ```bash
   # Ensure PostgreSQL, Redis, and Kafka are running
   ```
2. **Service Registry (Eureka)**:
   ```bash
   cd service-registry && mvn spring-boot:run
   # Wait until http://localhost:8761 is accessible
   ```
3. **Config Server**:
   ```bash
   cd config-server && mvn spring-boot:run
   # Wait until http://localhost:8888 is accessible
   ```
4. **API Gateway**:
   ```bash
   cd api-gateway && mvn spring-boot:run
   ```
5. **Domain Services** (can be launched in parallel):
   ```bash
   cd auth-service && mvn spring-boot:run
   cd user-service && mvn spring-boot:run
   cd product-service && mvn spring-boot:run
   cd cart-service && mvn spring-boot:run
   cd order-service && mvn spring-boot:run
   cd wishlist-service && mvn spring-boot:run
   cd notification-service && mvn spring-boot:run
   ```
6. **Frontend**:
   ```bash
   cd frontend && npm install && npm run dev
   # Open http://localhost:3000
   ```

---

## 7. Security & Gateway Header Propagation

All client requests must pass through the API Gateway on port `8080`.
The Gateway validates JWT tokens and automatically enriches downstream HTTP requests with validated identity headers:
- `X-User-Id`: Authenticated user's unique identifier (UUID / Long).
- `X-User-Email`: Authenticated user's registered email address.
- `X-User-Role`: Authorized security role (`ROLE_CUSTOMER`, `ROLE_SELLER`, `ROLE_ADMIN`).

Downstream microservices use these headers to establish local Spring Security context or controller parameter extraction without re-validating the JWT against the database.
