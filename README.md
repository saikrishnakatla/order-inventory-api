# OrderFlow — Full-Stack Order & Inventory Management System

A production-grade, high-concurrency Full-Stack e-commerce and inventory management application. Engineered with an Express/Node.js backend, MySQL ACID transactions using pessimistic row locking (`SELECT ... FOR UPDATE`), in-memory Redis caching (< 1ms read latency), stateless JWT role-based access control, Zod schema validation, and a modern React 19 + Tailwind CSS frontend.

---

## Architecture Overview

```
                            Client Browser
                                  │
                                  ▼
               ┌──────────────────────────────────────┐
               │     React 19 + Tailwind CSS (Vite)   │
               │   - Dynamic in-cart stock tracker    │
               │   - Slide-over Cart & Checkout       │
               │   - Role-Based Admin Dashboard       │
               └──────────────────┬───────────────────┘
                                  │ HTTP / REST (Bearer JWT)
                                  ▼
               ┌──────────────────────────────────────┐
               │       Express / Node.js Engine       │
               │   - Helmet Security Headers          │
               │   - IP-based Sliding Rate Limiters   │
               │   - Zod Schema Validation            │
               │   - JWT Auth & RBAC Middleware       │
               └──────────────────┬───────────────────┘
                                  │
                   ┌──────────────┴──────────────┐
                   ▼                             ▼
        ┌─────────────────────┐       ┌──────────────────────┐
        │     Redis Cache     │       │     MySQL Engine     │
        │ - Cache-Aside (RAM) │       │ - ACID Transactions  │
        │ - Sub-ms Reads      │       │ - Pessimistic Locks  │
        │ - Cache Eviction    │       │   (FOR UPDATE)       │
        └─────────────────────┘       └──────────────────────┘
```

---

## Key Engineering Highlights

### 1. Concurrency-Safe ACID Checkout
- Prevents race conditions and inventory overselling during simultaneous checkouts.
- Uses dedicated connection pooling with explicit transactions:
  ```sql
  START TRANSACTION;
  SELECT id, name, price, stock FROM products WHERE id = ? FOR UPDATE;
  -- Validate stock >= requested quantity
  INSERT INTO orders (...);
  INSERT INTO order_items (...);
  UPDATE products SET stock = stock - ? WHERE id = ?;
  COMMIT; -- or ROLLBACK on any failure
  ```

### 2. High-Performance Redis Caching (Cache-Aside)
- Frequently queried product catalog reads are cached in Redis with TTL.
- **Cache Invalidation:** Mutations (`POST /products`, `PATCH /products/:id`, and `POST /orders`) immediately evict stale cache keys (`cache:products:all`), ensuring 100% data freshness without stale inventory reads.

### 3. Authentication & Role-Based Access Control (RBAC)
- **Password Security:** Salted one-way hashing with `bcrypt` (10 rounds).
- **Stateless Tokens:** Signed HMAC-SHA256 JWTs carrying identity and permissions.
- **RBAC Enforcement:**
  - `Customer`: Browsing catalog, placing orders.
  - `Admin`: Catalog mutations, restocking inventory, price adjustments (`requireRole('admin')`).

### 4. Input Validation & API Hardening
- **Zod Schemas:** Declarative payload validation on `req.body`, returning field-specific `400 Bad Request` messages and stripping unknown malicious keys.
- **Helmet:** Automatically sets 11 enterprise HTTP security headers.
- **Rate Limiting:** Sliding-window rate limiters preventing credential stuffing on `/api/auth` (15 req/15 min) and DDoS attacks on catalog endpoints.

---

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS v4, Lucide React, Axios, React Router v7.
- **Backend:** Node.js, Express 5, `mysql2`, `ioredis`, `jsonwebtoken`, `bcrypt`, `zod`, `helmet`, `express-rate-limit`, `cors`.
- **Databases:** MySQL 8.0, Redis 7.

---

## Project Structure (Monorepo)

```text
order-inventory-system/
├── client/                     # React + Vite Frontend
│   ├── src/
│   │   ├── api/                # Central Axios client & interceptors
│   │   ├── context/            # AuthContext & CartContext
│   │   ├── components/         # Navbar, ProductCard, CartDrawer, ProtectedRoute
│   │   └── pages/              # HomePage, LoginPage, RegisterPage, AdminPage
│   ├── package.json
│   └── vite.config.js
├── server/                     # Node.js + Express Backend
│   ├── src/
│   │   ├── config/             # MySQL pool & Redis client
│   │   ├── controllers/        # Request handling & HTTP status formatting
│   │   ├── middlewares/        # Auth, RBAC, Validate, ErrorHandler
│   │   ├── routes/             # Auth, Products, Orders routers
│   │   ├── services/           # Business logic & ACID transactions
│   │   └── validators/         # Zod schemas (Auth, Products, Orders)
│   ├── .env.example
│   └── package.json
├── package.json                # Root package for running both simultaneously
└── README.md
```

---

## Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MySQL Server running on `localhost:3306`
- Redis Server running on `localhost:6379`

### 2. Database Setup
Execute the following DDL in your MySQL database (`order_inventory_db`):

```sql
CREATE DATABASE IF NOT EXISTS order_inventory_db;
USE order_inventory_db;

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('customer', 'admin') DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'completed', 'cancelled') DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_order_items_order_id (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 3. Environment Variables
Create `server/.env` with your local credentials:
```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=order_inventory_db
DB_PORT=3306

REDIS_HOST=127.0.0.1
REDIS_PORT=6379

JWT_SECRET=super_secret_jwt_key_2026_dev
JWT_EXPIRES_IN=1h
```

### 4. Installation & Single-Command Startup

From the project root directory:

```bash
# 1. Install root dependencies (concurrently)
npm install

# 2. Run both backend (port 3000) and frontend (port 5173) with a single command!
npm run dev
```

Open your browser at `http://localhost:5173` to explore the application.
