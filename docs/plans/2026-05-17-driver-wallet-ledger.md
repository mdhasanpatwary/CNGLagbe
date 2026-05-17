# Driver Wallet Transaction History Ledger Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Create a highly transparent and interactive Debit/Credit transaction history ledger for drivers in both the Admin Dashboard and Driver Portal.

**Architecture:** Implement server-side filtering and pagination in the wallet transaction APIs for both admins and drivers. Integrate a beautiful tab switcher in the admin driver history modal to toggle between Trip Records and Wallet Transactions. Update the driver wallet portal page to support dynamic filters.

**Tech Stack:** Next.js App Router, React (with Tailwind CSS), Prisma Client, Zod, TypeScript, Central Translation Dictionary (`TEXT`).

---

### Task 1: Create Admin Wallet History API

**Files:**
- Create: `app/api/admin/drivers/[id]/wallet/route.ts`

**Step 1: Write API Route**
Create `app/api/admin/drivers/[id]/wallet/route.ts` with server-side pagination, timeframe, and debit/credit filtering:

```typescript
import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = await getAuthenticatedAdmin();
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: driverId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
    const timeframe = searchParams.get("timeframe") || "all";
    const type = searchParams.get("type") || "ALL";
    const skip = (page - 1) * limit;

    // Get the driver's wallet ID
    const wallet = await prisma.driverWallet.findUnique({
      where: { driverId },
      select: { id: true },
    });

    if (!wallet) {
      return NextResponse.json({ transactions: [], meta: { total: 0, page, limit, totalPages: 0 } });
    }

    const whereClause: Prisma.WalletTransactionWhereInput = {
      walletId: wallet.id,
    };

    // Filter by Debit/Credit
    if (type === "DEBIT") {
      whereClause.amount = { lt: 0 };
    } else if (type === "CREDIT") {
      whereClause.amount = { gt: 0 };
    }

    // Filter by Timeframe
    if (timeframe !== "all") {
      const now = new Date();
      const start = new Date(now);
      if (timeframe === "today") {
        start.setHours(0, 0, 0, 0);
      } else if (timeframe === "weekly") {
        start.setDate(now.getDate() - 7);
      } else if (timeframe === "monthly") {
        start.setDate(now.getDate() - 30);
      }
      whereClause.createdAt = { gte: start };
    }

    const [transactions, totalFiltered] = await Promise.all([
      prisma.walletTransaction.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          booking: {
            select: {
              pickupAddress: true,
              destAddress: true,
            },
          },
        },
      }),
      prisma.walletTransaction.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      transactions,
      meta: {
        total: totalFiltered,
        page,
        limit,
        totalPages: Math.ceil(totalFiltered / limit),
      },
    });
  } catch (error) {
    console.error("Admin Fetch Wallet Ledger Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add app/api/admin/drivers/\[id\]/wallet/route.ts
git commit -m "feat: add admin driver wallet history api"
```

---

### Task 2: Enhance Driver Wallet API

**Files:**
- Modify: `app/api/driver/wallet/route.ts`

**Step 1: Write dynamic filters and pagination in Driver API**
Update `app/api/driver/wallet/route.ts` using `replace_file_content` to fetch transactions with dynamic filters:

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const session = await getAuthUser();
    if (!session || session.role !== "DRIVER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.sub;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
    const timeframe = searchParams.get("timeframe") || "all";
    const type = searchParams.get("type") || "ALL";
    const skip = (page - 1) * limit;

    const driverWallet = await prisma.driverWallet.findUnique({
      where: { driverId: userId },
      select: { id: true, balance: true, driver: { select: { id: true, name: true, photoUrl: true } } },
    });

    if (!driverWallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    const whereClause: Prisma.WalletTransactionWhereInput = {
      walletId: driverWallet.id,
    };

    if (type === "DEBIT") {
      whereClause.amount = { lt: 0 };
    } else if (type === "CREDIT") {
      whereClause.amount = { gt: 0 };
    }

    if (timeframe !== "all") {
      const now = new Date();
      const start = new Date(now);
      if (timeframe === "today") {
        start.setHours(0, 0, 0, 0);
      } else if (timeframe === "weekly") {
        start.setDate(now.getDate() - 7);
      } else if (timeframe === "monthly") {
        start.setDate(now.getDate() - 30);
      }
      whereClause.createdAt = { gte: start };
    }

    const [transactions, totalFiltered] = await Promise.all([
      prisma.walletTransaction.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          booking: {
            select: {
              pickupAddress: true,
              destAddress: true,
            },
          },
        },
      }),
      prisma.walletTransaction.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      balance: driverWallet.balance,
      driver: {
        id: driverWallet.driver.id,
        name: driverWallet.driver.name,
        photoUrl: driverWallet.driver.photoUrl,
        role: "DRIVER"
      },
      transactions,
      meta: {
        total: totalFiltered,
        page,
        limit,
        totalPages: Math.ceil(totalFiltered / limit),
      }
    });
  } catch (error) {
    console.error("Wallet API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add app/api/driver/wallet/route.ts
git commit -m "feat: enhance driver wallet api with dynamic filters"
```

---

### Task 3: Integrate Tab & Ledger View in Admin DriverHistoryModal

**Files:**
- Modify: `app/admin/components/shared/DriverHistoryModal.tsx`

**Step 1: Write new Tab states and fetch logic**
Open `app/admin/components/shared/DriverHistoryModal.tsx` and implement:
1. `activeTab` state: `"trips" | "ledger"` (default: `"trips"`).
2. States for ledger: `ledgerTransactions` array, `ledgerMeta` pagination metadata, `ledgerLoading` boolean, `ledgerPage` index, `ledgerTimeframe` string, `ledgerType` filter string.
3. Add a dedicated `useEffect` triggered when `activeTab === "ledger"` or `ledgerPage`, `ledgerTimeframe`, `ledgerType` change, fetching `/api/admin/drivers/${driver.id}/wallet`.

**Step 2: Add Tab bar UI**
Directly below the profile header details and stats strip, add a premium tab bar:
```tsx
<div className="flex border-b border-slate-100 px-6 bg-white gap-8">
  <button
    onClick={() => setActiveTab("trips")}
    className={`py-4 font-black uppercase text-[11px] tracking-widest border-b-2 transition-all ${
      activeTab === "trips"
        ? "border-primary text-primary"
        : "border-transparent text-slate-400 hover:text-slate-600"
    }`}
  >
    {t("trip_history")}
  </button>
  <button
    onClick={() => setActiveTab("ledger")}
    className={`py-4 font-black uppercase text-[11px] tracking-widest border-b-2 transition-all ${
      activeTab === "ledger"
        ? "border-primary text-primary"
        : "border-transparent text-slate-400 hover:text-slate-600"
    }`}
  >
    {t("wallet_history")}
  </button>
</div>
```

**Step 3: Render Ledger Content**
Under the dynamic tab condition, if `activeTab === "ledger"`:
1. Show Timeframe filters: *All, Today, 7 Days, 30 Days* using `FilterPill`.
2. Show Type filters: *All, Platform Fees (Debit), Recharges (Credit)*.
3. Show transaction cards with correct debit/credit styling and bilingual keys.
4. Render Pagination Controls.

**Step 4: Commit**

```bash
git add app/admin/components/shared/DriverHistoryModal.tsx
git commit -m "feat: integrate ledger tab and transaction list inside admin modal"
```

---

### Task 4: Upgrade Driver Portal Wallet UI

**Files:**
- Modify: `app/driver/wallet/page.tsx`

**Step 1: Add state variables and loading management**
Modify `app/driver/wallet/page.tsx` to handle:
- `page`: default `1`
- `timeframe`: default `"all"`
- `type`: default `"ALL"`
- Update the existing fetch effect to pass query parameters: `/api/driver/wallet?page=${page}&timeframe=${timeframe}&type=${type}`.

**Step 2: Add filter pills above transaction list**
Render dynamic filter pills with nice animations, adhering to UI guidelines (max 3 font sizes, bilingual labels, simple conversational layout).

**Step 3: Commit**

```bash
git add app/driver/wallet/page.tsx
git commit -m "feat: complete driver wallet portal UI with dynamic filters and pagination"
```
