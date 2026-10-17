# Cart Service

High-performance shopping cart microservice backed by Redis and PostgreSQL. Coordinates real-time price lookups, item quantity mutations, and inventory validation with `product-service`.

## Features
- **Dual Persistence Architecture**: Fast Redis cache for active shopping sessions with PostgreSQL backing store.
- **Product Enrichment**: Enriches cart item responses with real-time `productName` fetched from `product-service`.
- **Flexible Item Lookup**:
  - Supports updating and removing cart items by either `itemId` OR `listingId` / `productId`.
- **Fault-Tolerant Remote Communication**:
  - Resilient OpenFeign integration with `product-service` with fallback pricing.
- **Post-Commit Kafka Event Publishing**:
  - Dispatches `CART_UPDATED` and `CART_CLEARED` events.

## API Endpoints
| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/cart` | Authenticated | Retrieve current user's active shopping cart |
| `POST` | `/api/v1/cart/items` | Authenticated | Add product/listing to cart |
| `PUT` | `/api/v1/cart/items/{id}` | Authenticated | Update quantity by `itemId` or `listingId` |
| `DELETE` | `/api/v1/cart/items/{id}` | Authenticated | Remove item by `itemId` or `listingId` |
| `DELETE` | `/api/v1/cart` | Authenticated | Clear all items from cart |

## Tech Stack
- Java 21, Spring Boot 3.4.1
- Redis, PostgreSQL (`ecommerce_cart_db`)
- Spring Cloud OpenFeign
- Apache Kafka (`cart-events`)

## Running Locally
```bash
mvn clean spring-boot:run
```
