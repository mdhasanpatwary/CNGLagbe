# Admin Dashboard Table Search & Filter Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement standardized search and filter controls across all administrative tables in the CNGLagbe admin panel.

**Architecture:** Integrate query states into the centralized `useAdminDashboard` hook, support Prisma server-side searching for Users/Bookings, client-side filtering for Bazars, and build responsive, accessible search and filter components.

**Tech Stack:** Next.js, Prisma, TailwindCSS/Shadcn UI, React Hook Form (where applicable), Lucide React.

---

### Task 1: API Route for Users Search & Filtering
**Files:**
- Modify: `app/api/admin/users/route.ts`

**Step 1: Write mock test or request query verification**
Verify current request query parsing support by checking URL query parameters for search/role.

**Step 2: Update route implementation**
Support parameters `search` and `role` and pass correct Prisma where filters:
```typescript
const search = searchParams.get("search") || "";
const role = searchParams.get("role") || "ALL";

const whereClause: any = {};
if (search) {
  whereClause.OR = [
    { name: { contains: search, mode: "insensitive" } },
    { phone: { contains: search, mode: "insensitive" } }
  ];
}
if (role && role !== "ALL") {
  whereClause.role = role;
}
```

**Step 3: Commit**
```bash
git add app/api/admin/users/route.ts
git commit -m "api: support server-side search and filtering for users"
```

---

### Task 2: API Route for Bookings Search
**Files:**
- Modify: `app/api/admin/bookings/route.ts`

**Step 1: Write query parsing updates**
Implement parameter `search` parsing inside the booking route.

**Step 2: Update Prisma query with relations**
```typescript
const search = searchParams.get("search") || "";

if (search) {
  whereClause.AND = [
    ...(whereClause.AND || []),
    {
      OR: [
        { id: { contains: search, mode: "insensitive" } },
        { pickupAddress: { contains: search, mode: "insensitive" } },
        { destAddress: { contains: search, mode: "insensitive" } },
        {
          driver: {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } }
            ]
          }
        },
        {
          user: {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } }
            ]
          }
        }
      ]
    }
  ];
}
```

**Step 3: Commit**
```bash
git add app/api/admin/bookings/route.ts
git commit -m "api: support server-side relation-aware search for bookings"
```

---

### Task 3: State Hook Integration in `useAdminDashboard`
**Files:**
- Modify: `app/admin/hooks/useAdminDashboard.ts`

**Step 1: Add new states**
Add search, debounce, pagination, and filter states for users and bookings:
- `userSearch`, `debouncedUserSearch`, `userFilter`, `userPage`, `userMeta`, `allUsers`
- `bookingSearch`, `debouncedBookingSearch`

**Step 2: Wire up active hook refetches**
Write standard query synchronization and refetching logic for the hook under the active tab effects.

**Step 3: Commit**
```bash
git add app/admin/hooks/useAdminDashboard.ts
git commit -m "feat: integrate users and bookings search/filter state in useAdminDashboard"
```

---

### Task 4: UI Standard Search Elements in Component Tabs
**Files:**
- Modify: `app/admin/components/tabs/UsersTab.tsx`
- Modify: `app/admin/components/tabs/BazarsTab.tsx`
- Modify: `app/admin/components/tabs/LogsTab.tsx`
- Modify: `app/admin/components/tabs/OverviewTab.tsx`

**Step 1: Update BazarsTab with local client-side filter**
Add a beautiful search field at the header to filter bazars in memory.

**Step 2: Update UsersTab with server-side controls & roles**
Integrate `userSearch`, `userFilter` and link it with the hook props. Ensure design token compliance.

**Step 3: Update LogsTab with server-side search input**
Ensure the status dropdown and search input align nicely in the header layout.

**Step 4: Update OverviewTab with search input & filters for Recent Bookings**
Ensure the layout matches the dashboard standard.

**Step 5: Commit**
```bash
git add app/admin/components/tabs/
git commit -m "ui: implement standardized search and filter controls in all admin tabs"
```

---

### Task 5: Compilation Check and Verification
**Step 1: Verify code compilation**
Run: `npm run build` or `tsc --noEmit`
Expected: Successful compile with no lint or TypeScript errors.
