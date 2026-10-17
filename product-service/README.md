# Product Service

Catalog, inventory listings, categories, and brands management microservice. Implements marketplace multi-seller inventory with concurrency control.

## Features
- **Product Catalog**:
  - Global product catalog management (names, descriptions, categories, brands, specifications, tags).
  - High-resolution `imageUrl` support in entity, DTOs, and mapper pipelines.
  - Public browsing and search with pagination and filtering.
- **Marketplace Listings**:
  - Multi-seller listing model where multiple sellers can list offers for the same catalog product.
  - Root listing query mapping (`GET /api/v1/listings?productId={id}&sellerId={id}`) for buy-box comparison.
  - Optimistic concurrency control via `@Version` on `Listing` to prevent race conditions during inventory deductions.
  - Atomic stock reservation, deduction, and restoration endpoints for order checkout.
- **Role Verification**:
  - Strict role verification supporting both `ROLE_SELLER` and `ROLE_ADMIN`.
- **Post-Commit Kafka Event Publishing**:
  - Publishes `PRODUCT_CREATED`, `LISTING_CREATED`, `STOCK_UPDATED` events post-commit.

## API Endpoints
| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/products` | Public | Search & list products (page, size, category, brand, search) |
| `GET` | `/api/v1/products/{id}` | Public | Get product details by ID |
| `POST` | `/api/v1/products` | `ROLE_ADMIN` | Create new product |
| `PUT` | `/api/v1/products/{id}` | `ROLE_ADMIN` | Update product details |
| `DELETE` | `/api/v1/products/{id}` | `ROLE_ADMIN` | Delete product |
| `GET` | `/api/v1/categories` | Public | List all categories |
| `POST` | `/api/v1/categories` | `ROLE_ADMIN` | Create category |
| `GET` | `/api/v1/brands` | Public | List all brands |
| `POST` | `/api/v1/brands` | `ROLE_ADMIN` | Create brand |
| `GET` | `/api/v1/listings` | Public | Query listings (by `productId`, `sellerId`, or `status`) |
| `GET` | `/api/v1/listings/my` | `ROLE_SELLER` | Get seller's own listings |
| `POST` | `/api/v1/listings` | `ROLE_SELLER` | Create listing for a product |
| `PUT` | `/api/v1/listings/{id}` | `ROLE_SELLER`, `ROLE_ADMIN` | Update listing price/stock |
| `DELETE` | `/api/v1/listings/{id}` | `ROLE_SELLER`, `ROLE_ADMIN` | Delete/deactivate listing |
| `POST` | `/api/v1/listings/{id}/deduct-stock` | Internal / Order | Deduct inventory stock |
| `POST` | `/api/v1/listings/{id}/restore-stock` | Internal / Order | Restore inventory stock upon cancellation |

## Tech Stack
- Java 21, Spring Boot 3.4.1
- Spring Data JPA, PostgreSQL (`ecommerce_product_db`)
- Apache Kafka (`product-events`)

## Running Locally
```bash
mvn clean spring-boot:run
```
