# Component Splitting Architecture & Rules Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Establish a strict 500-line React component limit, update agent rules, and refactor Driver History (Admin Modal & Driver Page) by separating business logic into custom hooks and de-duplicating UI presentation helpers.

**Architecture:** We will create reusable components in `components/ui/` for metrics, filter tabs, and badges. Central Types will be added to `lib/types/booking.ts`. Business state and queries will be extracted into modular custom hooks (`useDriverHistory` and `useDriverPortalHistory`), reducing both primary visual files below 300 lines of code.

**Tech Stack:** React 18, Next.js (App Router), TypeScript, Lucide Icons, Vanilla CSS / Tailwind.

---

### Task 1: Update Agent Rules & System Identity Documentation

**Files:**
- Modify: [AGENTS.md](file:///Users/patwary/Projects/CNGLagbe/AGENTS.md)
- Modify: [IDENTITY.md](file:///Users/patwary/Projects/CNGLagbe/IDENTITY.md)

**Step 1: Modify AGENTS.md**
Add the new line-limit rule as the 6th rule in the `## Architecture & Code Structure (MANDATORY)` section:

```markdown
6. **Component Line Limit**: No React component or page file should exceed 500 lines. If a file grows beyond 500 lines, it MUST be refactored by:
   - Extracting business logic, local state, API requests, and complex React lifecycles into modular custom hooks (e.g., `useDriverPortalHistory`).
   - Moving duplicated or stand-alone UI units into smaller reusable presentational components (dumb components).
   - Moving utility calculations into helper files.
```

**Step 2: Modify IDENTITY.md**
Add the core architectural principle under `## Approved Architecture Principles` -> `### Logic & UI Separation`:

```markdown
- **Component Line Limit**: React components and page files MUST NOT exceed 500 lines. Any file exceeding this limit must be proactively split into custom hooks, smaller reusable presentational components, or utility files to keep the rendering layer lightweight, highly readable, and easily testable.
```

**Step 3: Verify & Commit**
```bash
git add AGENTS.md IDENTITY.md
git commit -m "docs: add strict 500-line component limit to AGENTS.md and IDENTITY.md"
```

---

### Task 2: Create Reusable UI Design System Components

**Files:**
- Create: [components/ui/StatCard.tsx](file:///Users/patwary/Projects/CNGLagbe/components/ui/StatCard.tsx)
- Create: [components/ui/FilterPill.tsx](file:///Users/patwary/Projects/CNGLagbe/components/ui/FilterPill.tsx)
- Create: [components/ui/StatusBadge.tsx](file:///Users/patwary/Projects/CNGLagbe/components/ui/StatusBadge.tsx)

**Step 1: Write components/ui/StatCard.tsx**
Create the file and write the standard card view for numeric metrics:

```tsx
import React from "react";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  accent?: boolean;
}

export function StatCard({ label, value, icon, accent }: StatCardProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-3 rounded-2xl border shadow-sm text-center ${
        accent
          ? "bg-primary text-white border-primary"
          : "bg-white border-slate-100"
      }`}
    >
      <div className={`mb-1.5 ${accent ? "text-white/80" : "text-slate-400"}`}>
        {icon}
      </div>
      <p
        className={`text-[9px] font-black uppercase tracking-tight mb-0.5 ${
          accent ? "text-white/70" : "text-slate-400"
        }`}
      >
        {label}
      </p>
      <div
        className={`text-lg font-black leading-none ${
          accent ? "text-white" : "text-slate-800"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
```

**Step 2: Write components/ui/FilterPill.tsx**
Create the file and write the scrollable filter pill view:

```tsx
import { AppButton } from "@/components/ui/AppButton";

interface FilterPillProps {
  active: boolean;
  label: string;
  onClick: () => void;
}

export function FilterPill({ active, label, onClick }: FilterPillProps) {
  return (
    <AppButton
      variant={active ? "primary" : "ghost"}
      onClick={onClick}
      className={`whitespace-nowrap !h-8 !rounded-full !text-[11px] !font-black !uppercase !tracking-widest !px-4 ${
        active
          ? "shadow-sm shadow-primary/30"
          : "!bg-white !text-slate-500 border border-slate-200 hover:border-primary/40 hover:!text-primary"
      }`}
    >
      {label}
    </AppButton>
  );
}
```

**Step 3: Write components/ui/StatusBadge.tsx**
Create the status indicator for completed and cancelled rides:

```tsx
import { CheckCircle2, XCircle } from "lucide-react";

interface StatusBadgeProps {
  status: "COMPLETED" | "CANCELLED";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status === "COMPLETED") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary-dark text-[10px] font-black uppercase tracking-wider">
        <CheckCircle2 className="w-3 h-3" />
        <span>Done</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-wider">
      <XCircle className="w-3 h-3" />
      <span>Cancelled</span>
    </span>
  );
}
```

**Step 4: Commit**
```bash
git add components/ui/StatCard.tsx components/ui/FilterPill.tsx components/ui/StatusBadge.tsx
git commit -m "feat: add de-duplicated design system components (StatCard, FilterPill, StatusBadge)"
```

---

### Task 3: Standardize central TypeScript Types

**Files:**
- Modify: [lib/types/booking.ts](file:///Users/patwary/Projects/CNGLagbe/lib/types/booking.ts)

**Step 1: Append types**
Append the four interfaces (`TripRecord`, `PaginationMeta`, `LedgerTransaction`, `LedgerPaginationMeta`) to [lib/types/booking.ts](file:///Users/patwary/Projects/CNGLagbe/lib/types/booking.ts):

```typescript
export interface TripRecord {
  id: string;
  status: "COMPLETED" | "CANCELLED";
  fare: number;
  baseFare?: number | null;
  platformFee?: number | null;
  totalFare?: number | null;
  distance: number;
  pickupAddress?: string | null;
  destAddress?: string | null;
  createdAt: string;
  completedAt?: string | null;
  cancelledAt?: string | null;
  rating?: number | null;
  feedback?: string | null;
  user?: {
    name: string;
    phone: string;
  } | null;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: {
    lifetimeTrips: number;
    totalEarned: number;
    avgRating: number;
    ratingCount: number;
  };
}

export interface LedgerTransaction {
  id: string;
  amount: number;
  type: string;
  details?: string | null;
  createdAt: string;
  booking?: {
    pickupAddress?: string | null;
    destAddress?: string | null;
  } | null;
}

export interface LedgerPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

**Step 2: Commit**
```bash
git add lib/types/booking.ts
git commit -m "feat: centralize history and wallet ledger TypeScript types"
```

---

### Task 4: Implement Custom Hook for Driver History Modal

**Files:**
- Create: [app/admin/hooks/useDriverHistory.ts](file:///Users/patwary/Projects/CNGLagbe/app/admin/hooks/useDriverHistory.ts)

**Step 1: Write Hook Logic**
Create the file and implement hook code:

```typescript
import { useEffect, useState } from "react";
import { PendingDriver } from "@/lib/types/admin";
import { TripRecord, PaginationMeta, LedgerTransaction, LedgerPaginationMeta } from "@/lib/types/booking";

interface UseDriverHistoryProps {
  isOpen: boolean;
  driver: PendingDriver | null;
}

export function useDriverHistory({ isOpen, driver }: UseDriverHistoryProps) {
  const [activeTab, setActiveTab] = useState<"trips" | "ledger">("trips");
  
  // Trip History States
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [timeframe, setTimeframe] = useState<string>("all");

  // Ledger Wallet States
  const [ledgerTransactions, setLedgerTransactions] = useState<LedgerTransaction[]>([]);
  const [ledgerMeta, setLedgerMeta] = useState<LedgerPaginationMeta | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerTimeframe, setLedgerTimeframe] = useState<string>("all");
  const [ledgerType, setLedgerType] = useState<string>("ALL");

  // Fetch Wallet Ledger
  useEffect(() => {
    if (!isOpen || !driver || activeTab !== "ledger") return;

    const fetchLedger = async () => {
      setLedgerLoading(true);
      try {
        const query = new URLSearchParams({
          page: ledgerPage.toString(),
          limit: "10",
          timeframe: ledgerTimeframe,
          type: ledgerType,
        });

        const res = await fetch(`/api/admin/drivers/${driver.id}/wallet?${query.toString()}`);
        const data = await res.json();
        setLedgerTransactions(data.transactions ?? []);
        setLedgerMeta(data.meta ?? null);
      } catch (err) {
        console.error("Failed to fetch wallet ledger:", err);
      } finally {
        setLedgerLoading(false);
      }
    };

    fetchLedger();
  }, [isOpen, driver, activeTab, ledgerPage, ledgerTimeframe, ledgerType]);

  // Fetch Trip History
  useEffect(() => {
    if (!isOpen || !driver) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams({
          page: page.toString(),
          limit: "10",
          timeframe,
        });
        if (statusFilter !== "ALL") query.append("status", statusFilter);

        const res = await fetch(`/api/admin/drivers/${driver.id}/history?${query.toString()}`);
        const data = await res.json();
        setTrips(data.bookings ?? []);
        setMeta(data.meta ?? null);
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, driver, page, statusFilter, timeframe]);

  const handleTabChange = (tab: "trips" | "ledger") => {
    setActiveTab(tab);
    setPage(1);
    setLedgerPage(1);
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleTimeframeChange = (tf: string) => {
    setTimeframe(tf);
    setPage(1);
  };

  const handleLedgerTimeframeChange = (tf: string) => {
    setLedgerTimeframe(tf);
    setLedgerPage(1);
  };

  const handleLedgerTypeChange = (type: string) => {
    setLedgerType(type);
    setLedgerPage(1);
  };

  return {
    activeTab,
    handleTabChange,
    
    // Trips
    trips,
    meta,
    loading,
    page,
    statusFilter,
    timeframe,
    handleStatusChange,
    handleTimeframeChange,
    setPage,

    // Ledger
    ledgerTransactions,
    ledgerMeta,
    ledgerLoading,
    ledgerPage,
    ledgerTimeframe,
    ledgerType,
    handleLedgerTimeframeChange,
    handleLedgerTypeChange,
    setLedgerPage,
  };
}
```

**Step 2: Commit**
```bash
git add app/admin/hooks/useDriverHistory.ts
git commit -m "feat: add useDriverHistory hook for admin driver details modal"
```

---

### Task 5: Implement Custom Hook for Driver Portal History Page

**Files:**
- Create: [app/driver/hooks/useDriverPortalHistory.ts](file:///Users/patwary/Projects/CNGLagbe/app/driver/hooks/useDriverPortalHistory.ts)

**Step 1: Write Hook Logic**
Create the file and write page query handling logic:

```typescript
import { useEffect, useState } from "react";
import { TripRecord, PaginationMeta } from "@/lib/types/booking";
import { apiFetch } from "@/utils/api";

export function useDriverPortalHistory() {
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [timeframe, setTimeframe] = useState<string>("all");

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({
      page: page.toString(),
      limit: "10",
      timeframe,
    });
    if (statusFilter !== "ALL") query.append("status", statusFilter);

    apiFetch(`/api/driver/history?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (active) {
          setTrips(data.bookings ?? []);
          setMeta(data.meta ?? null);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch history:", err);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, statusFilter, timeframe]);

  const handleStatusChange = (status: string) => {
    setLoading(true);
    setStatusFilter(status);
    setPage(1);
  };

  const handleTimeframeChange = (tf: string) => {
    setLoading(true);
    setTimeframe(tf);
    setPage(1);
  };

  const handlePageChange = (p: number) => {
    setLoading(true);
    setPage(p);
  };

  return {
    trips,
    meta,
    loading,
    page,
    statusFilter,
    timeframe,
    handleStatusChange,
    handleTimeframeChange,
    handlePageChange,
  };
}
```

**Step 2: Commit**
```bash
git add app/driver/hooks/useDriverPortalHistory.ts
git commit -m "feat: add useDriverPortalHistory hook for driver trip listing page"
```

---

### Task 6: Refactor Admin DriverHistoryModal UI

**Files:**
- Modify: [app/admin/components/shared/DriverHistoryModal.tsx](file:///Users/patwary/Projects/CNGLagbe/app/admin/components/shared/DriverHistoryModal.tsx)

**Step 1: Rewrite Modal Component**
Replace the file with the clean presentational implementation leveraging our central hook and components:

```tsx
"use client";

import {
  Calendar,
  Banknote,
  Navigation,
  Star,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  MapPin,
  TrendingUp,
  Route,
  User,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLang } from "@/hooks/useLang";
import { AppButton } from "@/components/ui/AppButton";
import { formatDecimal } from "@/lib/utils";
import { PendingDriver } from "@/lib/types/admin";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/StatCard";
import { FilterPill } from "@/components/ui/FilterPill";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useDriverHistory } from "@/app/admin/hooks/useDriverHistory";

interface DriverHistoryModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  driver: PendingDriver | null;
}

export function DriverHistoryModal({
  isOpen,
  onOpenChange,
  driver,
}: DriverHistoryModalProps) {
  const { t } = useLang();
  
  const {
    activeTab,
    handleTabChange,
    trips,
    meta,
    loading,
    page,
    statusFilter,
    timeframe,
    handleStatusChange,
    handleTimeframeChange,
    setPage,
    ledgerTransactions,
    ledgerMeta,
    ledgerLoading,
    ledgerPage,
    ledgerTimeframe,
    ledgerType,
    handleLedgerTimeframeChange,
    handleLedgerTypeChange,
    setLedgerPage,
  } = useDriverHistory({ isOpen, driver });

  const stats = meta?.stats || {
    lifetimeTrips: 0,
    totalEarned: 0,
    avgRating: 0,
    ratingCount: 0,
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-slate-50 rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col">
        {/* Header */}
        <div className="bg-white p-6 border-b border-slate-100 sticky top-0 z-10">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 leading-tight">
                  {driver?.name || t("driver_history")}
                </h3>
                <p className="text-sm font-bold text-slate-400 mt-0.5">
                  {driver?.phone} • {driver?.vehicleNumber || "N/A"}
                </p>
              </div>
            </div>
            <AppButton
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="w-10 h-10 p-0 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={18} />
            </AppButton>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label={t("lifetime_trips")}
              value={stats.lifetimeTrips}
              icon={<TrendingUp className="w-4 h-4" />}
              accent
            />
            <StatCard
              label={t("total_earned")}
              value={
                <span className="text-lg">
                  {t("currency")}
                  {formatDecimal(stats.totalEarned)}
                </span>
              }
              icon={<Banknote className="w-4 h-4" />}
            />
            <StatCard
              label={t("rating_score")}
              value={
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>
                    {stats.avgRating > 0 ? formatDecimal(stats.avgRating, 1) : "—"}
                  </span>
                  {stats.ratingCount > 0 && (
                    <span className="text-[10px] font-bold text-slate-400 mt-1">
                      ({stats.ratingCount})
                    </span>
                  )}
                </div>
              }
              icon={<Star className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-4 flex flex-col gap-4">
          {/* Tab Selector */}
          <div className="flex border-b border-slate-100 bg-white gap-8 -mx-6 -mt-4 px-6 mb-2 sticky top-0 z-10">
            <AppButton
              variant="ghost"
              onClick={() => handleTabChange("trips")}
              className={`!py-3 !px-0 !h-auto font-black uppercase text-[11px] tracking-widest border-b-2 transition-all rounded-none hover:bg-transparent ${
                activeTab === "trips"
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {t("trip_history")}
            </AppButton>
            <AppButton
              variant="ghost"
              onClick={() => handleTabChange("ledger")}
              className={`!py-3 !px-0 !h-auto font-black uppercase text-[11px] tracking-widest border-b-2 transition-all rounded-none hover:bg-transparent ${
                activeTab === "ledger"
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {t("wallet")} {t("wallet_history")}
            </AppButton>
          </div>

          {activeTab === "trips" ? (
            <>
              {/* Filters */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {[
                    { key: "all", label: t("all_time") },
                    { key: "today", label: t("today") },
                    { key: "weekly", label: t("last_7_days") },
                    { key: "monthly", label: t("this_month") },
                  ].map(({ key, label }) => (
                    <FilterPill
                      key={key}
                      active={timeframe === key}
                      label={label}
                      onClick={() => handleTimeframeChange(key)}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {[
                    { key: "ALL", label: t("all") },
                    { key: "COMPLETED", label: t("completed") },
                    { key: "CANCELLED", label: t("cancelled") },
                  ].map(({ key, label }) => (
                    <FilterPill
                      key={key}
                      active={statusFilter === key}
                      label={label}
                      onClick={() => handleStatusChange(key)}
                    />
                  ))}
                </div>
              </div>

              {/* Trip list */}
              {loading ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-40 w-full rounded-2xl" />
                  ))}
                </div>
              ) : trips.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                    <Navigation size={28} className="text-slate-200" />
                  </div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    {t("no_trips_found")}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {trips.map((trip) => (
                    <Card
                      key={trip.id}
                      className="border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl overflow-hidden bg-white"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                            <span className="text-[11px] font-bold text-slate-400 tabular-nums">
                              {new Intl.DateTimeFormat("en-BD", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }).format(new Date(trip.createdAt))}
                            </span>
                          </div>
                          <StatusBadge status={trip.status} />
                        </div>

                        <div className="relative flex flex-col gap-1 mb-3 pl-2">
                          <div className="absolute left-[5px] top-[14px] bottom-[14px] w-px bg-slate-100" />
                          <div className="flex items-center gap-2.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 ring-4 ring-primary/10 z-10" />
                            <p className="text-xs font-semibold text-slate-700 line-clamp-1">
                              {trip.pickupAddress || t("pickup_point")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <MapPin className="w-2.5 h-2.5 text-slate-300 shrink-0 z-10" />
                            <p className="text-xs text-slate-400 line-clamp-1">
                              {trip.destAddress || t("drop_point")}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between py-2.5 border-t border-slate-50 mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center">
                              <Banknote className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-slate-300 uppercase leading-none mb-0.5">
                                {t("fare")}
                              </p>
                              <p className="text-sm font-black text-slate-800 tabular-nums">
                                {t("currency")}
                                {formatDecimal(trip.totalFare || trip.fare)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-slate-300">
                              <Route className="w-3.5 h-3.5" />
                              <span className="text-xs font-bold tabular-nums">
                                {formatDecimal(trip.distance, 1)} km
                              </span>
                            </div>
                          </div>
                        </div>

                        {trip.status === "COMPLETED" && trip.rating != null ? (
                          <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100/50">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-3 h-3 ${star <= trip.rating!
                                        ? "text-amber-400 fill-amber-400"
                                        : "text-slate-200 fill-slate-200"
                                      }`}
                                  />
                                ))}
                              </div>
                              {trip.user && (
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                  {trip.user.name}
                                </span>
                              )}
                            </div>
                            {trip.feedback && (
                              <div className="flex items-start gap-1.5 mt-1.5">
                                <MessageSquare className="w-3 h-3 text-amber-300 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-slate-500 italic">
                                  &ldquo;{trip.feedback}&rdquo;
                                </p>
                              </div>
                            )}
                          </div>
                        ) : trip.status === "COMPLETED" ? (
                          <div className="flex items-center gap-1.5 text-slate-200 py-1">
                            <Star className="w-3 h-3" />
                            <p className="text-[10px] font-bold uppercase tracking-wider">
                              {t("not_rated")}
                            </p>
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Trip Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-2 pb-4">
                  <AppButton
                    variant="ghost"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                    className="!h-9 !rounded-xl !text-[10px] !font-black !px-4"
                  >
                    <div className="flex items-center gap-1">
                      <ChevronLeft className="w-4 h-4" />
                      {t("prev")}
                    </div>
                  </AppButton>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {t("page")} {page} / {meta.totalPages}
                  </span>
                  <AppButton
                    variant="ghost"
                    onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                    disabled={page === meta.totalPages || loading}
                    className="!h-9 !rounded-xl !text-[10px] !font-black !px-4"
                  >
                    <div className="flex items-center gap-1">
                      {t("next")}
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </AppButton>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Ledger Filters */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {[
                    { key: "all", label: t("all_time") },
                    { key: "today", label: t("today") },
                    { key: "weekly", label: t("last_7_days") },
                    { key: "monthly", label: t("this_month") },
                  ].map(({ key, label }) => (
                    <FilterPill
                      key={key}
                      active={ledgerTimeframe === key}
                      label={label}
                      onClick={() => handleLedgerTimeframeChange(key)}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {[
                    { key: "ALL", label: t("all") },
                    { key: "DEBIT", label: t("platform_fee") },
                    { key: "CREDIT", label: t("wallet_recharge") },
                  ].map(({ key, label }) => (
                    <FilterPill
                      key={key}
                      active={ledgerType === key}
                      label={label}
                      onClick={() => handleLedgerTypeChange(key)}
                    />
                  ))}
                </div>
              </div>

              {/* Ledger List */}
              {ledgerLoading ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-28 w-full rounded-2xl" />
                  ))}
                </div>
              ) : ledgerTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                    <Clock size={28} className="text-slate-200" />
                  </div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    {t("no_bookings_found") || "No transactions found"}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {ledgerTransactions.map((tx) => (
                    <Card
                      key={tx.id}
                      className="border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl overflow-hidden bg-white"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                            <span className="text-[11px] font-bold text-slate-400 tabular-nums">
                              {new Intl.DateTimeFormat("en-BD", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }).format(new Date(tx.createdAt))}
                            </span>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            tx.amount < 0 
                              ? "bg-red-50 text-red-700" 
                              : "bg-emerald-50 text-emerald-700"
                          }`}>
                            {tx.amount < 0 ? (
                              <div className="flex items-center gap-1">
                                <ArrowUpRight className="w-3 h-3 text-red-500" />
                                <span>{t("wallet_debt")}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <ArrowDownLeft className="w-3 h-3 text-emerald-500" />
                                <span>{t("wallet_recharge")}</span>
                              </div>
                            )}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-black text-slate-800 leading-tight">
                              {tx.details || (tx.type === "BOOKING_FEE" ? t("booking_fee") : tx.type)}
                            </h4>
                            {tx.booking && (
                              <p className="text-[10px] text-slate-400 font-medium truncate mt-1 flex items-center gap-1">
                                <Navigation size={8} /> {tx.booking.pickupAddress?.split(",")[0]} → {tx.booking.destAddress?.split(",")[0]}
                              </p>
                            )}
                          </div>
                          
                          <div className="text-right shrink-0">
                            <p className={`text-lg font-black ${
                              tx.amount < 0 ? "text-red-500" : "text-emerald-500"
                            }`}>
                              {tx.amount < 0 ? "-" : "+"}{t("currency")}{formatDecimal(Math.abs(tx.amount))}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Ledger Pagination */}
              {ledgerMeta && ledgerMeta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-2 pb-4">
                  <AppButton
                    variant="ghost"
                    onClick={() => setLedgerPage((p) => Math.max(1, p - 1))}
                    disabled={ledgerPage === 1 || ledgerLoading}
                    className="!h-9 !rounded-xl !text-[10px] !font-black !px-4"
                  >
                    <div className="flex items-center gap-1">
                      <ChevronLeft className="w-4 h-4" />
                      {t("prev")}
                    </div>
                  </AppButton>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {t("page")} {ledgerPage} / {ledgerMeta.totalPages}
                  </span>
                  <AppButton
                    variant="ghost"
                    onClick={() => setLedgerPage((p) => Math.min(ledgerMeta.totalPages, p + 1))}
                    disabled={ledgerPage === ledgerMeta.totalPages || ledgerLoading}
                    className="!h-9 !rounded-xl !text-[10px] !font-black !px-4"
                  >
                    <div className="flex items-center gap-1">
                      {t("next")}
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </AppButton>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**
```bash
git add app/admin/components/shared/DriverHistoryModal.tsx
git commit -m "refactor: simplify DriverHistoryModal into a dumb presentation shell using custom hook"
```

---

### Task 7: Refactor Driver Portal History Page UI

**Files:**
- Modify: [app/driver/history/page.tsx](file:///Users/patwary/Projects/CNGLagbe/app/driver/history/page.tsx)

**Step 1: Rewrite Page Component**
Replace the file with the clean presentational page implementation utilizing custom hooks and centralized UI utilities:

```tsx
"use client";

import {
  Calendar,
  Banknote,
  Navigation,
  Star,
  MessageSquare,
  Clock,
  Route,
  ChevronLeft,
  ChevronRight,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLang } from "@/hooks/useLang";
import { Header } from "@/components/layout/Header";
import { PageHeading } from "@/components/ui/PageHeading";
import { AppButton } from "@/components/ui/AppButton";
import { DriverHistorySkeleton } from "@/components/ui/AppSkeletons";
import { formatDecimal } from "@/lib/utils";
import { StatCard } from "@/components/ui/StatCard";
import { FilterPill } from "@/components/ui/FilterPill";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useDriverPortalHistory } from "@/app/driver/hooks/useDriverPortalHistory";

// ─── Star Rating Helper ──────────────────────────────────────────────────────

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3 h-3 ${
            star <= value
              ? "text-amber-400 fill-amber-400"
              : "text-slate-200 fill-slate-200"
          }`}
        />
      ))}
      <span className="text-xs font-black text-amber-500 ml-1">
        {value.toFixed(1)}
      </span>
    </div>
  );
}

// ─── Date Formats ────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

function formatDateShort(dateStr: string) {
  return new Intl.DateTimeFormat("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

// ─── Empty State Helper ──────────────────────────────────────────────────────

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Navigation size={28} className="text-slate-300" />
      </div>
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
        {label}
      </p>
    </div>
  );
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function DriverHistoryPage() {
  const { t } = useLang();
  
  const {
    trips,
    meta,
    loading,
    page,
    statusFilter,
    timeframe,
    handleStatusChange,
    handleTimeframeChange,
    handlePageChange,
  } = useDriverPortalHistory();

  const stats = meta?.stats || { lifetimeTrips: 0, totalEarned: 0, avgRating: 0, ratingCount: 0 };

  const timeframeOptions = [
    { key: "all", label: t("all_time") },
    { key: "today", label: t("today") },
    { key: "weekly", label: t("last_7_days") },
    { key: "monthly", label: t("this_month") },
  ];

  const statusOptions = [
    { key: "ALL", label: t("all") },
    { key: "COMPLETED", label: t("completed") },
    { key: "CANCELLED", label: t("cancelled") },
  ];

  return (
    <div className="min-h-screen flex flex-col pb-24 premium-bg-surface relative overflow-hidden">
      <div className="absolute inset-0 dot-grid-texture opacity-30 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

      <Header role="driver" />

      <main className="relative px-4 pt-2 pb-8 w-full max-w-md mx-auto flex flex-col gap-4 flex-1">
        <PageHeading
          title={t("trip_history")}
          subtitle={t("driver_portal")}
          backHref="/driver/dashboard"
        />

        {/* Stats strip */}
        {loading && page === 1 ? (
          <DriverHistorySkeleton />
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2.5">
              <StatCard
                label={t("lifetime_trips")}
                value={stats.lifetimeTrips}
                icon={<TrendingUp className="w-4 h-4" />}
                accent
              />
              <StatCard
                label={t("total_earned")}
                value={
                  <span className="text-base">
                    {t("currency")}
                    {formatDecimal(stats.totalEarned)}
                  </span>
                }
                icon={<Banknote className="w-4 h-4" />}
              />
              <StatCard
                label={t("rating_score")}
                value={
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>
                        {stats.avgRating > 0 ? formatDecimal(stats.avgRating, 1) : "—"}
                      </span>
                    </div>
                    {stats.ratingCount > 0 && (
                      <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                        ({stats.ratingCount})
                      </span>
                    )}
                  </div>
                }
                icon={<Star className="w-4 h-4" />}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {timeframeOptions.map(({ key, label }) => (
                  <FilterPill
                    key={key}
                    active={timeframe === key}
                    label={label}
                    onClick={() => handleTimeframeChange(key)}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {statusOptions.map(({ key, label }) => (
                  <FilterPill
                    key={key}
                    active={statusFilter === key}
                    label={label}
                    onClick={() => handleStatusChange(key)}
                  />
                ))}
              </div>
            </div>

            {/* Trip list */}
            {trips.length === 0 ? (
              <EmptyState label={t("no_trips_yet")} />
            ) : (
              <div className="flex flex-col gap-3">
                {trips.map((trip) => (
                  <Card
                    key={trip.id}
                    className="border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 rounded-2xl overflow-hidden bg-white"
                  >
                    <CardContent className="p-4">
                      {/* Top row */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          </div>
                          <span className="text-[11px] font-bold text-slate-400 tabular-nums">
                            {formatDateShort(trip.createdAt)}
                          </span>
                        </div>
                        <StatusBadge status={trip.status} />
                      </div>

                      {/* Route */}
                      <div className="relative flex flex-col gap-1 mb-3 pl-2">
                        <div className="absolute left-[5px] top-[14px] bottom-[14px] w-px bg-slate-200" />
                        <div className="flex items-center gap-2.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 ring-2 ring-primary/20 z-10" />
                          <p className="text-xs font-semibold text-slate-700 line-clamp-1 leading-tight">
                            {trip.pickupAddress || t("pickup_point")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0 z-10" />
                          <p className="text-xs text-slate-400 line-clamp-1 leading-tight">
                            {trip.destAddress || t("drop_point")}
                          </p>
                        </div>
                      </div>

                      {/* Fare + distance */}
                      <div className="flex items-center justify-between py-2.5 border-t border-b border-slate-50 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-primary/8 flex items-center justify-center">
                            <Banknote className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-0.5">
                              {trip.platformFee ? t("total_payable") : t("fare")}
                            </p>
                            <p className="text-sm font-black text-slate-800 tabular-nums">
                              {t("currency")}
                              {formatDecimal(trip.totalFare || trip.fare)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {trip.platformFee && (
                            <div className="text-right">
                              <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-0.5">
                                {t("platform_fee")}
                              </p>
                              <p className="text-xs font-black text-red-500 tabular-nums">
                                −{t("currency")}
                                {formatDecimal(trip.platformFee)}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-slate-400">
                            <Route className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold tabular-nums">
                              {formatDecimal(trip.distance, 1)} km
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Passenger rating */}
                      {trip.status === "COMPLETED" && trip.rating != null ? (
                        <div className="bg-amber-50 rounded-xl p-3 border border-amber-100/80">
                          <div className="flex items-center justify-between mb-1">
                            <StarRating value={trip.rating} />
                            {trip.user && (
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                {trip.user.name}
                              </span>
                            )}
                          </div>
                          {trip.feedback && (
                            <div className="flex items-start gap-1.5 mt-1.5">
                              <MessageSquare className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                              <p className="text-[11px] text-slate-600 italic leading-relaxed">
                                &ldquo;{trip.feedback}&rdquo;
                              </p>
                            </div>
                          )}
                        </div>
                      ) : trip.status === "COMPLETED" ? (
                        <div className="flex items-center gap-1.5 text-slate-300 py-1">
                          <Star className="w-3 h-3" />
                          <p className="text-[10px] font-bold uppercase tracking-wider">
                            {t("not_rated")}
                          </p>
                        </div>
                      ) : null}

                      {/* Cancellation time */}
                      {trip.status === "CANCELLED" && trip.cancelledAt && (
                        <div className="flex items-center gap-1.5 text-slate-400 pt-1">
                          <Clock className="w-3 h-3 text-red-400" />
                          <p className="text-[10px] font-bold text-slate-400">
                            {formatDate(trip.cancelledAt)}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 pb-4">
            <AppButton
              variant="ghost"
              onClick={() => handlePageChange(Math.max(1, page - 1))}
              disabled={page === 1 || loading}
              className="!h-9 !rounded-xl !text-[10px] !font-black !px-4"
            >
              <div className="flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" />
                {t("prev")}
              </div>
            </AppButton>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {t("page")} {page} / {meta.totalPages}
            </span>
            <AppButton
              variant="ghost"
              onClick={() =>
                handlePageChange(Math.min(meta.totalPages, page + 1))
              }
              disabled={page === meta.totalPages || loading}
              className="!h-9 !rounded-xl !text-[10px] !font-black !px-4"
            >
              <div className="flex items-center gap-1">
                {t("next")}
                <ChevronRight className="w-4 h-4" />
              </div>
            </AppButton>
          </div>
        )}
      </main>
    </div>
  );
}
```

**Step 2: Commit**
```bash
git add app/driver/history/page.tsx
git commit -m "refactor: simplify driver history page into a dumb presentation layout using custom hook"
```
