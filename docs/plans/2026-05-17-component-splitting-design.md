# Design Document: Component Splitting Architecture & Guideline

**Date:** 2026-05-17
**Status:** Approved

## Goal

Define and implement a strict quality rule preventing React component and page files from exceeding **500 lines**. Standardize code modularity by separating business logic (hooks) from visual rendering (dumb components) and de-duplicating common presentation helpers.

---

## Architectural Principles

1. **Strict 500-Line Limit:**
   - No React component or App Router page (`page.tsx`) may exceed 500 lines.
   - Any file approaching or exceeding this limit must be split.

2. **Separation of Concerns:**
   - **Custom Hooks:** All state management, side effects (`useEffect`), API fetch calls, and route state tracking must live in reusable hooks.
   - **Presentational Components:** Component files must act as lightweight, declarative UI shells receiving props and callbacks.
   - **Design System Extraction:** Repeated presentational helpers (e.g. status badges, statistics cards, filter tabs) must be extracted to `components/ui/` or shared modules.

---

## Planned Changes

### 1. Central Rulesets Updates
- **[AGENTS.md](file:///Users/patwary/Projects/CNGLagbe/AGENTS.md)**: Add component line limit under `## Architecture & Code Structure`.
- **[IDENTITY.md](file:///Users/patwary/Projects/CNGLagbe/IDENTITY.md)**: Add standard principle under `## Approved Architecture Principles` -> `### Logic & UI Separation`.

### 2. Design System Components
- **[NEW] [components/ui/StatCard.tsx](file:///Users/patwary/Projects/CNGLagbe/components/ui/StatCard.tsx)**: Reusable metric card with icons & optional accent theme.
- **[NEW] [components/ui/FilterPill.tsx](file:///Users/patwary/Projects/CNGLagbe/components/ui/FilterPill.tsx)**: Reusable filter pill/scroll-bar tab.
- **[NEW] [components/ui/StatusBadge.tsx](file:///Users/patwary/Projects/CNGLagbe/components/ui/StatusBadge.tsx)**: Shared trip/booking status badge (`COMPLETED` / `CANCELLED`).

### 3. Unified TypeScript Interfaces
- **[MODIFY] [lib/types/booking.ts](file:///Users/patwary/Projects/CNGLagbe/lib/types/booking.ts)**: Add `TripRecord`, `PaginationMeta`, `LedgerTransaction`, and `LedgerPaginationMeta` structures to resolve local duplication.

### 4. Modular Business Hooks
- **[NEW] [app/admin/hooks/useDriverHistory.ts](file:///Users/patwary/Projects/CNGLagbe/app/admin/hooks/useDriverHistory.ts)**: Implements React queries, state modifiers, pagination triggers, and tab selection for the driver overview details modal.
- **[NEW] [app/driver/hooks/useDriverPortalHistory.ts](file:///Users/patwary/Projects/CNGLagbe/app/driver/hooks/useDriverPortalHistory.ts)**: Handles the driver portal's personal trip list queries and filter updates.

### 5. Presentational Refactoring
- **[MODIFY] [app/admin/components/shared/DriverHistoryModal.tsx](file:///Users/patwary/Projects/CNGLagbe/app/admin/components/shared/DriverHistoryModal.tsx)**: Refactored into a pure visual shell. Lines reduced from **715** to **~280**.
- **[MODIFY] [app/driver/history/page.tsx](file:///Users/patwary/Projects/CNGLagbe/app/driver/history/page.tsx)**: Refactored into a lightweight page shell. Lines reduced from **523** to **~190**.

---

## Verification Plan

### Manual Verification
1. Open the Admin Dashboard -> Drivers tab -> View details modal. Verify that the Driver History Modal fetches history, toggles tabs (Trips vs Wallet History), changes pages, and filters correctly with zero errors.
2. Log in as a driver -> Navigate to `/driver/history`. Verify that all stats, timeframe lists, status search pill selections, and page pagination triggers operate correctly.

### Build & Lint Verification
- Run `yarn build` or `next lint` to confirm that all absolute/relative imports, type definitions, and hooks operate perfectly without compiling or linting errors.
