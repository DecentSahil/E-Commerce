# Order Service

Comprehensive order management and checkout saga orchestration service. Manages idempotency, inventory deduction, status lifecycles, and audit history.

## Features
- **Checkout from Cart**: Converts items from `cart-service` into an order, automatically verifying active listings and stock availability.
- **Product Name & Image Snapshotting**: Stores immutable snapshots of `productName`, `productSku`, and `productImageUrl` on order items to preserve historical accuracy.
- **Idempotency Protection**: Ensures duplicate client submissions using the `Idempotency-Key` header are safely returned without creating multiple orders or double-deducting stock.
- **Multi-Role Order Details**:
  - `ROLE_CUSTOMER`: Access own orders and cancellation.
  - `ROLE_SELLER`: Access orders containing seller's items and update fulfillment status (`GET /api/v1/orders/seller`, `PATCH /api/v1/orders/{id}/status`).
  - `ROLE_ADMIN`: Platform-wide order inspection and management.
- **Atomic Stock Restoration**: Eagerly fetches order items upon cancellation to safely restore product inventory via `product-service`.
- **Post-Commit Kafka Event Publishing**: Dispatches `ORDER_CREATED`, `ORDER_CONFIRMED`, `ORDER_STATUS_CHANGED`, `ORDER_CANCELLED`, and `ORDER_DELIVERED` events after database transaction commits.

## API Endpoints
| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/orders/checkout` | Customer | Checkout active cart into an order (`Idempotency-Key` supported) |
| `POST` | `/api/v1/orders` | Customer | Direct order creation |
| `GET` | `/api/v1/orders` | Customer | List current user's orders (paginated) |
| `GET` | `/api/v1/orders/{id}` | Customer / Seller / Admin | Get order details |
| `POST` | `/api/v1/orders/{id}/cancel` | Customer | Cancel pending/confirmed order (triggers stock restoration) |
| `GET` | `/api/v1/orders/{id}/history` | Customer / Seller / Admin | Audit timeline of order status transitions |
| `GET` | `/api/v1/orders/seller` | `ROLE_SELLER`, `ROLE_ADMIN` | List incoming orders for seller's products |
| `PATCH` | `/api/v1/orders/{id}/status` | `ROLE_SELLER`, `ROLE_ADMIN` | Transition order status (`CONFIRMED`, `SHIPPED`, `DELIVERED`, `CANCELLED`) |
| `GET` | `/api/v1/orders/admin/all` | `ROLE_ADMIN` | List all platform orders |
| `GET` | `/api/v1/orders/admin/{id}` | `ROLE_ADMIN` | Admin order inspection |

## Tech Stack
- Java 21, Spring Boot 3.4.1
- Spring Data JPA, PostgreSQL (`ecommerce_order_db`)
- Spring Cloud OpenFeign (integrating with `cart-service`, `product-service`, `user-service`)
- Apache Kafka (`order-events`)

## Running Locally
```bash
mvn clean spring-boot:run
```
