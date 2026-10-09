# 💳 Digital Wallet API

A robust, Fintech-grade **Digital Wallet and Payment Gateway API** built with **Node.js, Fastify, TypeScript, and Prisma ORM**.

Engineered around core financial software principles, this API features **Double-Entry Ledger Accounting**, **Request Idempotency**, **ACID Transactions**, **Ledger Reconciliation**, **HMAC-Signed Webhooks**, and **Virtual Card Issuance**.

---

## ✨ Key Features

### 🔐 Authentication & Session Security

- **Dual-Token System:** Short-lived JWT Access Tokens (`15m`) paired with database-backed Refresh Tokens (`7 days`).
- **Auto-Provisioning:** Automatic USD wallet creation upon user registration.

### 📊 Double-Entry Ledger Accounting

- **Partidas Dobradas (Double-Entry System):** Money is never created or destroyed out of nowhere. Every transaction creates paired `DEBIT` and `CREDIT` entries.
- **ACID Guarantees:** Atomic database transactions prevent partial state execution (if a transfer fails halfway, the entire operation rolls back).
- **Ledger Reconciliation:** Endpoint (`GET /wallet/reconcile`) that audits and verifies the cached wallet balance against the exact mathematical sum of all historical ledger entries.

### 🛡️ Financial Integrity & Idempotency

- **Duplicate-Charge Protection:** Mandatory `Idempotency-Key` headers on financial POST operations.
- **Cached Responses:** Duplicate incoming requests with the same key receive identical cached responses without re-executing transactions.

### 💳 Virtual Debit Cards

- **Card Issuance:** Issue virtual debit cards linked to user wallet balances with custom daily limits.
- **Card Controls:** Instantly freeze, unfreeze, or cancel cards (`ACTIVE`, `BLOCKED`, `CANCELLED`).

### 📄 Invoices & Payment Requests

- **Peer-to-Peer Requests:** Create payment requests/invoices for specific users or via email.
- **Settlement:** Idempotent invoice payment workflow that executes ledger debit/credit entries upon settlement.

### 🔔 HMAC-Signed Webhooks

- **Event Dispatching:** Asynchronous notification engine for events like `TRANSFER_COMPLETED` and `INVOICE_PAID`.
- **Security Signatures:** Payloads signed with `HMAC-SHA256` signatures (`X-Wallet-Signature` header) for target server verification.
- **Delivery Auditing:** Comprehensive logs for all webhook attempts and response codes.

---

## 🚀 Tech Stack

- **Runtime:** Node.js (ES Modules)
- **Language:** TypeScript
- **Web Framework:** Fastify (v5)
- **Database ORM:** Prisma ORM (v5)
- **Database:** PostgreSQL
- **Validation & Schemas:** Zod + Fastify Type Provider Zod
- **Documentation:** Fastify Swagger + Swagger UI (OpenAPI 3)
- **Security & Auth:** `@fastify/jwt`, `bcryptjs`, `crypto` (HMAC SHA-256)

---

## 🛠️ Prerequisites

- **Node.js** (v20.0.0 or higher)
- **PostgreSQL** running locally on port `5432` or accessible via connection string.

---

## ⚙️ Installation & Setup

### 1. Clone & Install Dependencies

```bash
cd digital-wallet-api
npm install
```
