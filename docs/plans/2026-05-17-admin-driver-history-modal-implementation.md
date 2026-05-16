# Admin Driver History Modal Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement a modal in the admin dashboard to view a specific driver's trip history and reviews.

**Architecture:** A new admin-protected API route to fetch driver-specific history, a reusable `DriverHistoryModal` component, and integration into the existing `DriversTab` and `useAdminDashboard` hook.

**Tech Stack:** Next.js (App Router), Prisma, Tailwind CSS, Lucide Icons, Shadcn UI (Table/Card).

---

### Task 1: Add Translation Keys

**Files:**
- Modify: `constants/text.ts`

**Step 1: Add new translation keys**
Add `view_history`, `driver_history`, `no_trips_found`, and `trip_history` to the `TEXT` object.

**Step 2: Commit**
```bash
git add constants/text.ts
git commit -m "intl: add driver history translation keys"
```

### Task 2: Create Admin Driver History API

**Files:**
- Create: `app/api/admin/drivers/[id]/history/route.ts`

**Step 1: Implement GET handler**
Fetch paginated bookings for the driver, including user info (name, phone) and calculate aggregate stats (total trips, total earned, avg rating).

**Step 2: Commit**
```bash
git add app/api/admin/drivers/[id]/history/route.ts
git commit -m "api: add admin driver history endpoint"
```

### Task 3: Update useAdminDashboard Hook

**Files:**
- Modify: `app/admin/hooks/useAdminDashboard.ts`

**Step 1: Add history modal state**
Add `isHistoryModalOpen`, `setIsHistoryModalOpen`, `historyDriver`, `setHistoryDriver` states.

**Step 2: Commit**
```bash
git add app/admin/hooks/useAdminDashboard.ts
git commit -m "feat: add history modal state to useAdminDashboard"
```

### Task 4: Create DriverHistoryModal Component

**Files:**
- Create: `app/admin/components/shared/DriverHistoryModal.tsx`
- Modify: `app/admin/components/shared/index.ts`

**Step 1: Implement UI**
Create a modal that displays stats, filters (timeframe, status), and a list of trip cards (date, addresses, fare, distance, rating).

**Step 2: Export Component**
Export `DriverHistoryModal` from `app/admin/components/shared/index.ts`.

**Step 3: Commit**
```bash
git add app/admin/components/shared/DriverHistoryModal.tsx app/admin/components/shared/index.ts
git commit -m "feat: create DriverHistoryModal component"
```

### Task 5: Integrate into DriversTab

**Files:**
- Modify: `app/admin/components/tabs/DriversTab.tsx`
- Modify: `app/admin/AdminDashboard.tsx`

**Step 1: Add History button to row**
Add a button with `History` icon in `DriversTab.tsx` action column.

**Step 2: Render Modal in Dashboard**
Include `<DriverHistoryModal />` in `AdminDashboard.tsx` at the bottom.

**Step 3: Commit**
```bash
git add app/admin/components/tabs/DriversTab.tsx app/admin/AdminDashboard.tsx
git commit -m "feat: integrate driver history button and modal"
```

### Task 6: Final Verification

**Step 1: Verify in browser**
Open admin dashboard, go to Drivers tab, click History on various drivers. Verify stats, list, and filters.

**Step 2: Commit**
```bash
git commit --allow-empty -m "chore: verify admin driver history feature"
```
