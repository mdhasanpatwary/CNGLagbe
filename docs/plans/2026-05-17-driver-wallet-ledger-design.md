# Design Document: Driver Wallet Transaction History Ledger

This document details the architectural layout, data structures, and user interface designs for implementing a transparent Debit/Credit transaction history ledger for drivers in CNGLagbe.

## Goal
Implement a transparent transaction ledger visible to both drivers (in the Driver Portal) and administrators (in the Admin Dashboard) to audit and review all debit and credit changes to a driver's wallet (such as platform fee deductions, manual admin recharges, and adjustments).

---

## Technical Specifications

### 1. Database Schema Alignment
The design leverages the existing models defined in `schema.prisma`:
* `DriverWallet`: Unique wallet associated with a `Driver` containing the current `balance`.
* `WalletTransaction`: Debit and credit transactions containing `amount` (Float), `type` (String, e.g., `'BOOKING_FEE'`, `'PAYMENT'`), `details` (String), `bookingId` (String?), and `createdAt` (DateTime).
  * **Debit (ফি কর্তন)**: Negative `amount` (e.g. `-10.00`)
  * **Credit (রিচার্জ/টাকা যোগ)**: Positive `amount` (e.g. `500.00`)

---

### 2. Backend API Endpoint Modifications

#### A. New Admin API: `GET /api/admin/drivers/[id]/wallet`
* **File**: `app/api/admin/drivers/[id]/wallet/route.ts`
* **Query Parameters**:
  * `page`: pagination index (default: `1`)
  * `limit`: records per page (default: `10`, maximum: `50`)
  * `timeframe`: `all` | `today` | `weekly` | `monthly`
  * `type`: `ALL` | `DEBIT` | `CREDIT`
* **Query Implementation**:
  ```typescript
  const whereClause: Prisma.WalletTransactionWhereInput = {
    wallet: { driverId },
  };

  // Type filter
  if (type === 'DEBIT') {
    whereClause.amount = { lt: 0 };
  } else if (type === 'CREDIT') {
    whereClause.amount = { gt: 0 };
  }

  // Timeframe filter
  if (timeframe !== 'all') {
    const start = new Date();
    if (timeframe === 'today') start.setHours(0, 0, 0, 0);
    else if (timeframe === 'weekly') start.setDate(start.getDate() - 7);
    else if (timeframe === 'monthly') start.setDate(start.getDate() - 30);
    whereClause.createdAt = { gte: start };
  }
  ```

#### B. Enhanced Driver API: `GET /api/driver/wallet`
* **File**: `app/api/driver/wallet/route.ts`
* Update this route to support the exact same query parameters (`page`, `limit`, `timeframe`, `type`) for dynamic pagination and filtering in the Driver Portal.

---

### 3. Frontend Component Design

#### A. Admin Dashboard: `DriverHistoryModal.tsx`
* Add two interactive tabs below the stats strip:
  * **Trip History (ট্রিপস)**
  * **Wallet Ledger (লেনদেন)**
* Switch between tabs by toggling a state: `activeTab: "trips" | "ledger"`.
* Render filters for the ledger tab:
  * **Timeframe pills**: *All Time, Today, 7 Days, 30 Days*
  * **Transaction Type pills**: *All, Fees (Debit), Recharges (Credit)*
* Render each transaction as a list card:
  * Indicator icons (`ArrowUpRight` in red with `-` sign for debits, `ArrowDownLeft` in green with `+` sign for credits).
  * Detailed text, date, and time.
  * Correct formatting via bilingual dictionary keys (`TEXT`).

#### B. Driver Portal: `app/driver/wallet/page.tsx`
* Upgrade the transaction list with filters matching the layout.
* Fetch transactions dynamically via a custom hook or clean state when filters are toggled.

---

## Bilingual Translation Dict Changes
We will update `constants/text.ts` with new bilingual keys if needed, or use existing translation keys such as:
* `wallet_history`: `{ en: "History", bn: "ইতিহাস" }`
* `booking_fee`: `{ en: "Platform Fee", bn: "প্ল্যাটফর্ম ফি" }`
* `wallet_recharge`: `{ en: "Wallet Recharge", bn: "ওয়ালেট রিচার্জ" }`
* `credit`: `{ en: "Credit", bn: "ব্যালেন্স" }`
* `debt`: `{ en: "Debt", bn: "বকেয়া" }`
* `all`: `{ en: "All", bn: "সব" }`
* `today`: `{ en: "Today", bn: "আজ" }`
* `last_7_days`: `{ en: "7 Days", bn: "৭ দিন" }`
* `this_month`: `{ en: "30 Days", bn: "৩০ দিন" }`
* `all_time`: `{ en: "All", bn: "সব সময়" }`

---

## Verification Plan

### 1. Database Verifications
Check that Prisma transactions populate correctly and point to standard fields.

### 2. Manual Verification
* Log in as an Administrator, open a driver's history modal, toggle the "Wallet Ledger" tab, filter transactions, and verify pagination.
* Log in as a Driver, navigate to the Wallet screen, change filters, and check that the correct subset of transactions is returned and beautifully rendered.
