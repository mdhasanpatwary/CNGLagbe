# Admin Dashboard Refactoring Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Split the monolithic `AdminDashboard.tsx` into hyper-granular components and a custom hook to improve maintainability and readability.

**Architecture:** A feature-based split using a custom hook (`useAdminDashboard`) for state/logic and presentational components for each tab and shared UI elements.

**Tech Stack:** React, Next.js (App Router), Lucide React, Radix UI (via shadcn/ui), Tailwind CSS.

---

### Task 1: Initialize Directory Structure

**Files:**
- Create: `app/admin/components/tabs/`
- Create: `app/admin/components/shared/`
- Create: `app/admin/hooks/`

**Step 1: Create directories**
Run: `mkdir -p app/admin/components/tabs app/admin/components/shared app/admin/hooks`
Expected: Directories created.

**Step 2: Commit**
Run: `git add app/admin/components/ app/admin/hooks/ && git commit -m "chore: initialize admin refactor directory structure"`

---

### Task 2: Extract Shared UI Components

**Files:**
- Create: `app/admin/components/shared/StatusBadge.tsx`
- Create: `app/admin/components/shared/StatsCard.tsx`
- Create: `app/admin/components/shared/TabNavigation.tsx`

**Step 1: Implement StatusBadge**
Extract the `StatusBadge` component from `AdminDashboard.tsx`.

**Step 2: Implement StatsCard**
Extract the metric card UI from the `overview` section.

**Step 3: Implement TabNavigation**
Extract the tab switcher UI.

**Step 4: Commit**
Run: `git add app/admin/components/shared/ && git commit -m "feat: extract shared admin ui components"`

---

### Task 3: Extract Custom Hook `useAdminDashboard`

**Files:**
- Create: `app/admin/hooks/useAdminDashboard.ts`

**Step 1: Move state and fetching logic**
Extract all state declarations, `useEffect` hooks, and handler functions from `AdminDashboard.tsx` into `useAdminDashboard.ts`.

**Step 2: Define and export the hook**
Ensure all necessary data and handlers are returned by the hook.

**Step 3: Commit**
Run: `git add app/admin/hooks/useAdminDashboard.ts && git commit -m "feat: extract useAdminDashboard hook"`

---

### Task 4: Extract Tab Components

**Files:**
- Create: `app/admin/components/tabs/OverviewTab.tsx`
- Create: `app/admin/components/tabs/DriversTab.tsx`
- Create: `app/admin/components/tabs/UsersTab.tsx`
- Create: `app/admin/components/tabs/BazarsTab.tsx`
- Create: `app/admin/components/tabs/LogsTab.tsx`

**Step 1: Implement OverviewTab**
Move the logic for StatsGrid, Monitoring, Pending Drivers, and Recent Bookings into `OverviewTab.tsx`.

**Step 2: Implement DriversTab**
Move the driver management table and search logic.

**Step 3: Implement UsersTab**
Move the user list table.

**Step 4: Implement BazarsTab**
Move the bazar management UI.

**Step 5: Implement LogsTab**
Move the full booking log table and filters.

**Step 6: Commit**
Run: `git add app/admin/components/tabs/ && git commit -m "feat: extract admin tab components"`

---

### Task 5: Extract RechargeModal

**Files:**
- Create: `app/admin/components/shared/RechargeModal.tsx`

**Step 1: Move modal logic**
Extract the recharge modal JSX from `AdminDashboard.tsx`.

**Step 2: Commit**
Run: `git add app/admin/components/shared/RechargeModal.tsx && git commit -m "feat: extract RechargeModal"`

---

### Task 6: Final Integration in `AdminDashboard.tsx`

**Files:**
- Modify: `app/admin/AdminDashboard.tsx`

**Step 1: Replace monolithic code**
Update `AdminDashboard.tsx` to use the `useAdminDashboard` hook and render the new components.

**Step 2: Verify and Cleanup**
Run: `yarn lint` and verify functionality in the browser.

**Step 3: Commit**
Run: `git add app/admin/AdminDashboard.tsx && git commit -m "refactor: complete admin dashboard refactoring"`
