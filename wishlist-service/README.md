# Wishlist Service

Customer wishlist and saved items microservice. Integrates with `product-service` to deliver enriched saved items for customers.

## Features
- **Item Enrichment**: Automatically enriches saved items with `productName` and `imageUrl` from `product-service`.
- **Item Existence Verification**: Provides `GET /api/v1/wishlist/items/{productId}/check` for instant heart/bookmark icon toggling on catalog cards.
- **Bulk Clearance**: Provides `DELETE /api/v1/wishlist` for one-click wishlist clearing.
- **Post-Commit Kafka Event Publishing**: Dispatches `WISHLIST_ITEM_ADDED` and `WISHLIST_ITEM_REMOVED` after database transaction commits.

## API Endpoints
| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/wishlist` | Authenticated | Retrieve customer's enriched wishlist items |
| `POST` | `/api/v1/wishlist/items/{productId}` | Authenticated | Add product to wishlist |
| `DELETE` | `/api/v1/wishlist/items/{productId}` | Authenticated | Remove product from wishlist |
| `GET` | `/api/v1/wishlist/items/{productId}/check` | Authenticated | Check if product exists in user's wishlist |
| `DELETE` | `/api/v1/wishlist` | Authenticated | Clear all items from user's wishlist |

## Tech Stack
- Java 21, Spring Boot 3.4.1
- Spring Data JPA, PostgreSQL (`ecommerce_wishlist_db`)
- Spring Cloud OpenFeign
- Apache Kafka (`wishlist-events`)

## Running Locally
```bash
mvn clean spring-boot:run
```
