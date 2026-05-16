# Design Doc: Admin Dashboard Refactoring

**Status:** Draft
**Date:** 2026-05-17
**Topic:** Admin Dashboard Refactoring

## 1. Goal
Split the monolithic `AdminDashboard.tsx` (1,300+ lines) into hyper-granular components and a custom hook to improve maintainability, readability, and testability.

## 2. Architecture

### 2.1 Component Structure
We will adopt a feature-based split with a clear separation between logic (hooks) and presentation (components).

```
app/admin/
├── components/
│   ├── tabs/
│   │   ├── OverviewTab.tsx
│   │   ├── DriversTab.tsx
│   │   ├── UsersTab.tsx
│   │   ├── BazarsTab.tsx
│   │   └── LogsTab.tsx
│   ├── shared/
│   │   ├── StatusBadge.tsx
│   │   ├── StatsCard.tsx
│   │   ├── TabNavigation.tsx
│   │   └── RechargeModal.tsx
│   └── DriverManagementModal.tsx (existing)
├── hooks/
│   └── useAdminDashboard.ts
├── AdminDashboard.tsx (Entry Point)
└── page.tsx
```

### 2.2 Data Flow
1. **`useAdminDashboard.ts`**: The "Brain". Manages all state (stats, bookings, users, drivers, bazars) and contains all side effects (fetching) and action handlers (approve, suspend, recharge).
2. **`AdminDashboard.tsx`**: The "Orchestrator". Initializes the hook and passes necessary data/handlers to sub-components.
3. **Tab Components**: Purely presentational components that receive data and callbacks via props.

## 3. Component Breakdown

### 3.1 `useAdminDashboard` (Custom Hook)
- **State**:
    - `stats`, `bookings`, `activeBookings`, `allUsers`, `bazars`
    - `allDrivers`, `pendingDrivers`, `onlineDrivers`
    - `activeTab`, `isRefreshing`, `logFilter`
    - `currentPage`, `driverPage`, `driverMeta`
    - Modal states (`isRechargeModalOpen`, `isDriverModalOpen`)
- **Actions**:
    - `fetchData()`, `fetchDrivers()`, `fetchBookings()`
    - `handleApprove()`, `handleToggleSuspend()`, `handleDeleteDriver()`
    - `handleRecharge()`, `handleAddBazar()`, `handleDeleteBazar()`, `handleUpdateBazar()`

### 3.2 Shared Components
- **`StatusBadge`**: Moved from `AdminDashboard.tsx` to a reusable component.
- **`StatsCard`**: Standardized metric card for the Overview tab.
- **`TabNavigation`**: The top tab switcher logic and UI.
- **`RechargeModal`**: The wallet recharge modal extracted for clarity.

### 3.3 Tab Components
- Each tab will be extracted into its own file in `components/tabs/`.
- Large tabs like `OverviewTab` will further be broken down into:
    - `StatsGrid`
    - `MonitoringSection` (Active Bookings + Online Drivers)
    - `PendingDriversList`
    - `RecentBookingsTable`

## 4. Implementation Strategy
1. Create directory structure.
2. Extract types and interfaces if needed.
3. Extract `useAdminDashboard` hook.
4. Extract shared UI components.
5. Extract tab components one by one.
6. Refactor `AdminDashboard.tsx` to use the new structure.
7. Verify functionality remains identical.

## 5. Verification Plan
- **Manual Verification**: Click through all tabs, perform search, pagination, driver approval, and wallet recharge to ensure zero regression.
- **Type Checking**: Run `tsc` to ensure all props are correctly typed.
- **Linting**: Run `yarn lint` to ensure code standards are met.
