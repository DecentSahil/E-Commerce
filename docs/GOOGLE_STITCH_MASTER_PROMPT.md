# Google Stitch Master Prompt: Multi-Role E-Commerce Platform

> **Target Audience:** Google Stitch / Frontend AI Designer  
> **Source Platform:** Enterprise Multi-Role Microservices E-Commerce Application  
> **Backend Architecture:** Spring Boot 3.4.1, Spring Cloud Gateway, Kafka Event Bus, PostgreSQL / Redis  
> **Roles Supported:** Guest / Public, Customer (`ROLE_USER`), Merchant / Seller (`ROLE_SELLER`), Platform Admin (`ROLE_ADMIN`)  
> **Scope:** Canonical Catalog, Multi-Seller Listings, Cart, Checkout, Order Lifecycle, Wishlist, Notifications, User Profiles, Merchant Operations, Platform Administration. *(Recommendation, analytics, and interaction tracking are explicitly excluded).*

---

## 1. Master System Prompt for Google Stitch

Copy and paste the prompt below directly into Google Stitch to generate the complete, production-grade frontend UI.

```text
You are an elite Principal Frontend Architect and Lead UI/UX Designer. 
Your task is to design a cohesive, production-ready, beautiful web application for a modern multi-role e-commerce platform.

### CORE APPLICATION PARADIGM & BUSINESS DOMAIN
1. Canonical Products vs. Seller Listings:
   - "Products" are canonical master records owned and cataloged exclusively by Platform Administrators (name, description, brand, category, tags, specifications, canonical image).
   - "Listings" are merchant inventory offers attached to a product (selling price, currency [INR/USD], stock quantity, condition [NEW, REFURBISHED, USED_LIKE_NEW, USED_GOOD, USED_FAIR], status [ACTIVE, INACTIVE, OUT_OF_STOCK]).
   - A single canonical Product can have multiple seller listings. Customers browse products, select a seller listing, and add that listing to their cart.
2. User Roles & Access Boundaries:
   - Guest / Public: Home, product catalog, search, category filter, product details, login, customer registration, seller registration.
   - Customer (ROLE_USER, AccountStatus=ACTIVE): Shopping cart, checkout, order history, order details, order cancellation (PENDING/CONFIRMED only), wishlist management, customer address book, user profile, in-app notifications.
   - Seller (ROLE_SELLER, AccountStatus=ACTIVE): Dedicated Seller Workspace (/seller). Manage seller's own listings (create listing against canonical product, update price/stock, delete), manage incoming orders containing seller's items, transition order status (PROCESSING, SHIPPED, DELIVERED, CANCELLED).
   - Admin (ROLE_ADMIN): Dedicated Platform Control Center (/admin). Manage canonical products, categories, brands, inspect all platform orders, force order status transitions, approve/reject pending seller registrations, update user roles.
3. Explicit Exclusions:
   - Do NOT include recommendation carousels, algorithmic "trending" feeds, or user tracking/analytics widgets.

### VISUAL DESIGN SYSTEM & AESTHETIC DIRECTION
- Color Palette:
  - Slate Neutral Foundation: Canvas #F8FAFC, Cards #FFFFFF, Borders #E2E8F0, Subtle Hover #F1F5F9.
  - Deep Midnight Navy: Text Headers #0F172A, Secondary Text #64748B, Layout Shell #1E293B.
  - Brand Accent: Indigo (#4F46E5 primary, #4338CA hover, #EEF2FF surface highlight).
  - Status Indicators:
    * Emerald/Success: DELIVERED, ACTIVE, APPROVED (#059669 / #ECFDF5 / #A7F3D0)
    * Amber/Warning: PENDING, PENDING_APPROVAL, LOW_STOCK (#D97706 / #FFFBEB / #FDE68A)
    * Blue/Info: CONFIRMED, PROCESSING (#2563EB / #EFF6FF / #BFDBFE)
    * Purple/Transit: SHIPPED (#7C3AED / #F5F3FF / #DDD6FE)
    * Rose/Destructive: CANCELLED, FAILED, DISABLED (#E11D48 / #FFF1F2 / #FECDD3)
- Typography:
  - Font Family: 'Plus Jakarta Sans', system-ui, sans-serif. Monospace for SKU/Order IDs: 'JetBrains Mono'.
  - Rhythmic scale: H1 (32-36px font-extrabold -0.03em tracking), H2 (24-28px font-bold), Body (14-15px font-medium), Micro-labels (11-12px font-semibold uppercase tracking-wider).
- Component Stylings:
  - Cards: 24px border radius (`rounded-3xl`), border `border-slate-200`, subtle shadow `0 1px 3px rgba(15,23,42,0.06)`, active hover translation `translate-y-[-2px]` with brand glow `0 10px 30px -5px rgba(79,70,229,0.12)`.
  - Buttons: 12px border radius (`rounded-xl`), font-semibold, micro-interactions with smooth transition.
  - Modals & Drawers: Centered dialogs with backdrop blur (`backdrop-blur-md bg-slate-900/40`), crisp dismiss buttons.

### REQUIRED PAGES & NAVIGATION
1. Storefront Shell & Public Pages:
   - Page P-01: Public Landing Page (`/`) with Hero, Category grid, Value props, Featured canonical products.
   - Page P-02: Product Catalog & Search (`/products`) with instant search, category sidebar, brand filter, stock badges, pagination.
   - Page P-03: Product Detail Page (`/products/:productId`) showing canonical gallery, specs table, brand/category badges, and Seller Listing Selector (price, condition, seller ID, Add to Cart, Wishlist heart toggle).
2. Authentication & Onboarding:
   - Page P-04: Customer / Seller Login (`/login`) with Password mode and OTP mode tabs.
   - Page P-05: Customer Registration (`/register`) with Step 1 (email + OTP request), Step 2 (enter 6-character OTP + password), immediate active login.
   - Page P-06: Seller Partner Registration (`/register/seller` or tab on `/register`) with OTP verification, yielding "Pending Approval" review state.
3. Customer Commerce & Lifecycle:
   - Page P-07: Shopping Cart (`/cart`) with line items, seller tag, unit price, quantity steppers, order subtotal, clear cart, Checkout CTA.
   - Page P-08: Checkout & Address Selection (`/checkout`) with saved address radio picker, inline new address modal, order summary breakdown, and Place Order action.
   - Page P-09: Order History (`/orders`) with order cards, status badges, item counts, timestamp, pagination.
   - Page P-10: Order Detail & Lifecycle (`/orders/:orderId`) with shipping address card, itemized table, total summary, full status timeline (PENDING -> CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED), and Cancel Order action (with reason modal for PENDING/CONFIRMED orders).
   - Page P-11: Customer Wishlist (`/wishlist`) grid with remove action and quick move to product details.
   - Page P-12: Customer Profile & Addresses (`/profile`) with profile avatar, name, phone, address list, set default address, edit/delete address modal.
   - Page P-13: In-App Notification Center (`/notifications`) with unread badge, unread filter, mark single read, mark all read, order alert deep-links.
4. Merchant / Seller Workspace (`/seller`):
   - Page P-14: Seller Operational Dashboard:
     * Tab 1: Listings Inventory (My Listings table, stock count, selling price, condition badge, status toggle, Add Listing Modal with Product search picker, Edit Price/Stock modal, Delete confirmation).
     * Tab 2: Seller Orders (Customer orders containing merchant items, buyer shipping address, status pills, Action button to advance status: PROCESSING -> SHIPPED -> DELIVERED or Cancel with reason).
5. Platform Administration (`/admin`):
   - Page P-15: Platform Administration Suite:
     * Tab 1: Canonical Catalog Management (Data table of products, category/brand badges, Create Product Modal with Multipart image upload, edit product, delete product).
     * Tab 2: Taxonomy Management (Category CRUD with name/description; Brand CRUD with name/description).
     * Tab 3: Platform Orders Oversight (Global order book, status filter, order inspection drawer, administrative force status transition).
     * Tab 4: Seller Approval Center (Pending seller registrations queue, approve seller button, reject button).

### BEHAVIORAL STATES TO SPECIFY FOR EVERY SCREEN
- Loading State: Skeleton loaders with subtle shimmer matching component layouts.
- Empty State: Clean vector illustration / Lucide icon, explanatory headline, primary CTA button.
- Error State: Error boundary banner with retry action and backend message parsing.
- Form Validation: Immediate inline feedback matching backend rules (e.g., OTP must be 6 alphanumeric chars, password min 8 chars, valid email).
- Access Denied: 403 Forbidden illustration with "Switch Account" or "Return Home" CTAs.
```

---

## 2. Modular Prompts by Functional Area

### Module A: Global Shell, Navigation, Storefront & Authentication

```text
Design the Global Shell, Public Storefront, and Authentication flows for our multi-role e-commerce platform.

Theme Tokens:
- Canvas: #F8FAFC, Neutral Slate: #0F172A, Primary Indigo: #4F46E5, Card Background: #FFFFFF.
- Typography: Plus Jakarta Sans, semi-bold body, extra-bold headings.

Screens to generate:
1. Global Navigation Bar & Footer (Public / Customer Variant):
   - Top Bar: Brand logo ("NEXUS COMMERCE"), Search Input with category dropdown, Wishlist button (with count badge), Cart button (with dynamic badge), Notifications bell (with unread indicator dot), and User Menu (Avatar / Sign In).
   - Dynamic Navigation Links: Storefront, Catalog, Categories, Become a Seller.
   - Responsive Mobile Bottom Navigation: Home, Catalog, Wishlist, Cart, Profile.
2. Home Landing Page (`/`):
   - Hero banner with headline "Engineered for Modern Commerce", search pill bar, curated category pills.
   - Value Proposition grid: "Verified Sellers", "Real-Time Inventory", "Express Dispatch", "Buyer Protection".
   - Featured Products Shelf: Canonical product cards displaying Product Image, Category badge, Brand badge, "Available from ₹X.XX", and "View Options" button.
3. Authentication Portal (`/login` & `/register`):
   - Split layout: Left promotional dark brand banner, Right glassmorphism auth card.
   - Login Tab: Toggle between "Password Login" (Email + Password) and "One-Time Password (OTP)" (Email -> Request OTP -> Enter 6-character code).
   - Register Tab: Toggle between "Customer Account" and "Merchant Seller Account".
   - Step 1: Email input + "Send 6-Digit OTP" button (with 60-second cooldown timer).
   - Step 2: 6-slot alphanumeric OTP boxes, Password input (min 8 chars), and "Create Account" CTA.
   - Seller Registration Banner: Notice stating "Seller accounts require platform administrative review before activation."
```

### Module B: Product Discovery, Catalog, and Product Detail Page

```text
Design the Product Discovery and Product Detail screens based on canonical products and seller listings.

Screens to generate:
1. Catalog & Search Page (`/products`):
   - Header: Breadcrumbs ("Home > Catalog"), Search query display, Sort dropdown ("Newest", "Name A-Z").
   - Left Sidebar Filters:
     * Category multi-select checkboxes (fetched from `/api/v1/categories`).
     * Brand multi-select checkboxes (fetched from `/api/v1/brands`).
     * Status filter (Active catalog items).
     * "Clear All Filters" button.
   - Product Grid (3-4 columns desktop, 2 columns tablet, 1 column mobile):
     * Canonical image with subtle zoom on hover.
     * Category badge (Indigo-50) and Brand badge (Slate-100).
     * Canonical product title and specifications snippet.
     * Quick action: Wishlist heart icon button (toggles active red heart via `/api/v1/wishlist/items/{productId}`).
     * "View Listings & Buy" primary button.
   - Pagination Bar: Page number controls, items per page selector.
   - Zero State: "No products matched your criteria" with clear filters button.
2. Product Detail Page (`/products/:productId`):
   - Breadcrumbs: Home > [Category Name] > [Product Name].
   - Left Gallery: Large high-resolution canonical product image, zoom overlay, thumbnail strip.
   - Center Product Info: Product Title, Brand badge, Category badge, SKU pill, Full markdown description.
   - Specifications Table: Key-value attributes in alternating clean slate rows (e.g., Processor, RAM, Color, Warranty).
   - Right "Offers & Buy Box" (CRITICAL):
     * Multiple Seller Listings Accordion / Card List:
       - Displays Seller ID / Merchant name, condition pill (`NEW` emerald, `REFURBISHED` blue, `USED_LIKE_NEW` amber).
       - Selling Price in bold currency format (e.g. `₹49,999.00`).
       - Real-time stock status badge (`X units in stock` or `Out of Stock`).
       - Quantity selector (+ / - stepper, capped at stockQuantity).
       - Primary CTA: "Add to Cart" button (dispatches `/api/v1/cart/items` with productId, listingId, quantity).
     * Secondary action: "Save to Wishlist" toggle button.
```

### Module C: Cart, Checkout, Order Lifecycle & Wishlist

```text
Design the complete Customer Checkout Journey and Post-Order Lifecycle screens.

Screens to generate:
1. Shopping Cart (`/cart`):
   - Items list with: Product name, seller listing ID, unit price, quantity steppers, item subtotal, trash icon button.
   - Summary Card (Sticky right on desktop): Subtotal, Estimated Tax (₹0.00), Shipping Cost (Free), Grand Total.
   - Actions: "Clear Cart" button, "Proceed to Checkout" primary CTA button.
   - Empty Cart State: Illustrated shopping bag, "Your cart is empty", "Start Browsing" button.
2. Checkout Page (`/checkout`):
   - Two-column layout:
     * Column 1 - Shipping Address Selector:
       - Grid of saved address cards with radio selector. Default address marked with star badge.
       - "Add New Address" button triggering inline address drawer (Full name, phone, address line 1, line 2, city, state, postal code, country code ISO 2-letter, "Set as default" checkbox).
       - Customer delivery instructions textarea.
     * Column 2 - Order Review & Place Order:
       - Item summary list.
       - Price breakdown (Subtotal, Shipping, Grand Total).
       - "Place Order" button (POST `/api/v1/orders/checkout` with shippingAddress and idempotencyKey).
       - Secure transaction disclaimer.
3. Order History (`/orders`):
   - Filter tabs: All, Active, Delivered, Cancelled.
   - Order Cards: Header with Order Number (ORD-YYYYMMDD-XXXXX), Created Date, Payment Status pill, Order Status badge (PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED).
   - Thumbnail previews of ordered items with count ("+ 2 more items").
   - Grand Total in bold.
   - "View Order Details" button.
4. Order Detail & Tracking Page (`/orders/:orderId`):
   - Order Header with status banner and download receipt button.
   - Visual Progress Stepper (Horizontal on desktop, vertical on mobile):
     * Placed -> Confirmed -> Processing -> Shipped -> Delivered.
     * Highlights current step with date timestamp.
   - Shipping Address Card + Customer Note Card.
   - Line Items Table: Thumbnail, Item title, SKU, Seller ID, Unit price, Quantity, Line total.
   - Cost Breakdown Box.
   - Status History Log: Audit trail showing status transitions, timestamps, and reasons.
   - Cancellation Action: If order status is PENDING or CONFIRMED, render "Cancel Order" button. Clicking opens modal prompting for cancellation reason, then dispatches `POST /api/v1/orders/{id}/cancel`.
5. Customer Wishlist (`/wishlist`):
   - Grid of saved products with thumbnail, title, date added.
   - Action buttons: "View Product Options", "Remove from Wishlist".
```

### Module D: Customer Profile & In-App Notifications

```text
Design the Customer Account Settings and Notification Hub.

Screens to generate:
1. Customer Profile Page (`/profile`):
   - Tabs: "Personal Information", "Address Book".
   - Personal Information Tab:
     * Avatar with upload placeholder, Email (read-only), First Name, Last Name, Phone Number.
     * Save Changes button (PUT `/api/v1/users/me`).
     * Dangerous Zone: "Delete Account Profile" button with confirmation modal.
   - Address Book Tab:
     * Cards for each address displaying Recipient Name, Phone, Address Lines, City, State, Postal Code, Country.
     * Default badge on primary address.
     * Actions per card: "Set as Default" (PATCH), "Edit" (PUT), "Delete" (DELETE).
     * "+ Add New Address" modal button.
2. Notification Center (`/notifications`):
   - Header with Unread Count indicator badge ("3 unread").
   - Filter bar: "All Notifications" vs. "Unread Only" toggle switch.
   - Global Action: "Mark All as Read" button (PATCH `/api/v1/notifications/read-all`).
   - Notification Feed:
     * Cards with type-specific icons: ORDER_CREATED (Shopping bag), ORDER_SHIPPED (Truck), ORDER_DELIVERED (Checkmark), OTP (Key), SYSTEM (Bell).
     * Notification title, message body, relative timestamp ("10m ago"), read status indicator dot.
     * Click card: marks single notification as read (PATCH `/api/v1/notifications/{id}/read`) and deep-links to the reference order if applicable.
```

### Module E: Merchant / Seller Workspace (`/seller`)

```text
Design the dedicated Operational Seller Workspace for merchants.

Navigation Shell:
- Distinct Seller Navbar with "Merchant Portal", Store ID pill, and Switch to Storefront link.
- Tab bar: "Inventory Listings", "Customer Orders", "Performance Summary".

Screens to generate:
1. Listings Management Tab:
   - Header: Stats summary (Total Active Listings, Low Stock Alerts, Total Inventory Value).
   - Primary Action: "+ Add New Listing" button.
   - Add Listing Modal:
     * Step 1: Select Canonical Product (autocomplete search querying `/api/v1/products`).
     * Step 2: Listing details: Selling Price (number), Currency (INR dropdown), Stock Quantity (integer), Condition dropdown (NEW, REFURBISHED, USED_LIKE_NEW, USED_GOOD, USED_FAIR), Status dropdown (ACTIVE, INACTIVE).
     * Submit action (POST `/api/v1/listings`).
   - Listings Data Table:
     * Columns: Product (Image + Name), Condition pill, Unit Price, Stock Quantity (highlighted red if 0), Status badge, Date Updated, Actions.
     * Actions: Quick Stock Adjust (+ / -), Edit Listing Modal, Delete Listing button with ConfirmModal.
2. Seller Orders Fulfillment Tab:
   - Header: "Orders Containing Your Items" with count and filter by status.
   - Orders Table:
     * Order Number, Date, Customer Shipping City/State, Merchant Items in order, Seller Payout Total.
     * Current Order Status pill.
     * Action Button: "Update Fulfillment Status" opening modal:
       - Select new status: PROCESSING, SHIPPED, DELIVERED, or CANCELLED.
       - Optional Reason / Tracking number input.
       - Submit action (PATCH `/api/v1/orders/{id}/status`).
```

### Module F: Platform Administrator Workspace (`/admin`)

```text
Design the Platform Administrator Control Center.

Navigation Shell:
- Admin Header with Shield badge "Super Admin", Quick Search, and Platform Health pill.
- Navigation Sidebar / Tabs: "Products Catalog", "Categories & Brands", "Orders Oversight", "Seller Approvals".

Screens to generate:
1. Canonical Products Catalog Tab:
   - Stats Bar: Total Products, Active Catalog, Archived Items.
   - Primary Action: "+ Create Canonical Product" button.
   - Product Creation / Edit Modal:
     * Form: Product Name, Description, Category select, Brand select, Tags input (comma separated), Key-value Specifications table.
     * Multipart File Upload Component: Drag & drop image uploader calling `POST /api/v1/products/upload-image`, displaying uploaded preview URL.
   - Products Table: Thumbnail, Title, Category badge, Brand badge, Status toggle, Actions (Edit, Upload Image, Delete).
2. Categories & Brands Management Tab:
   - Split layout:
     * Left Column: Categories List + "+ Add Category" modal (Name, Description).
     * Right Column: Brands List + "+ Add Brand" modal (Name, Description).
3. Platform Orders Oversight Tab:
   - Full global orders table across all users and sellers.
   - Filter by Order Status and Date range.
   - Click order: Opens Slide-over Inspection Drawer showing buyer details, seller listings breakdown, status audit history, and Emergency Status Override dropdown.
4. Seller Approvals Tab (Backend Verified Endpoint `/api/v1/auth/admin/sellers/pending`):
   - Header: "Pending Seller Applications" with counter badge.
   - Pending Sellers Table:
     * Email, User ID, Date Registered, Status pill (`PENDING_APPROVAL`).
     * Actions:
       - "Approve Seller" button (PATCH `/api/v1/auth/admin/sellers/{userId}/approve`).
       - "Reject Seller" button (PATCH `/api/v1/auth/admin/sellers/{userId}/reject`).
     * Success banner on approval with instant table refresh.
```
