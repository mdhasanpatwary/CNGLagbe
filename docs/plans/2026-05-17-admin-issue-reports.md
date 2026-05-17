# Issue Reports Feature Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Build a complete passenger complaint box (Issue Report) and admin resolution dashboard following the lightweight trust-focused availability network architecture.

**Architecture:** 
1. Database: Update `IssueReport` with `resolutionNote` and `resolvedAt`, run migration.
2. API Layer: Implement route for passenger submission (`POST /api/booking/[id]/report`), listing/filtering for admin (`GET /api/admin/issues`), and resolution for admin (`POST /api/admin/issues/[id]/resolve`).
3. UI Layer: Add "Report an Issue" modal to completed/cancelled booking page for passengers, and a dedicated `IssuesTab` with an `IssueResolutionModal` inside the Admin Dashboard.

**Tech Stack:** Next.js (App Router), Prisma (PostgreSQL), Tailwind CSS, Lucide React, react-hook-form, nuqs, Zod.

---

## Technical Details & Steps

### Task 1: Database Migration & Schema Update
- **Files:** 
  - Modify: `prisma/schema.prisma`
- **Steps:**
  1. Add `resolutionNote String?` and `resolvedAt DateTime?` to `IssueReport` model in `prisma/schema.prisma`.
  2. Add indexes `@@index([status])` and `@@index([createdAt])` to `IssueReport` model.
  3. Run terminal migration command to update PostgreSQL:
     ```bash
     npx prisma migrate dev --name add_resolution_to_issue_report
     ```
  4. Verify compilation of Prisma Client.

### Task 2: Type Definitions Update
- **Files:**
  - Create/Modify: `lib/types/admin.ts`
- **Steps:**
  1. Define and export `IssueReportType` matching our schema.
  2. Ensure relations (`booking`, `user`, `driver`) are typed.

### Task 3: API Route for Passenger Submission
- **Files:**
  - Create: `app/api/booking/[id]/report/route.ts`
- **Steps:**
  1. Authenticate user session.
  2. Verify booking existence and check that `booking.userId === session.userId` and `booking.status` is `COMPLETED` or `CANCELLED`.
  3. Validate input `reason` and optional `details` (using Zod or standard validation).
  4. Insert record into `IssueReport` table via Prisma with `"OPEN"` status.

### Task 4: API Route for Admin Issues Fetching
- **Files:**
  - Create: `app/api/admin/issues/route.ts`
- **Steps:**
  1. Authenticate admin using `getAuthenticatedAdmin()`.
  2. Parse query filters: `status` (`ALL`, `OPEN`, `RESOLVED`), pagination (`page`, `limit`).
  3. Query `IssueReport` records with relations, ordered by `createdAt` descending.
  4. Return list of issues and pagination metadata.

### Task 5: API Route for Admin Resolution
- **Files:**
  - Create: `app/api/admin/issues/[id]/resolve/route.ts`
- **Steps:**
  1. Authenticate admin.
  2. Validate payload containing `resolutionNote`.
  3. Update `IssueReport` status to `"RESOLVED"`, set `resolutionNote` and `resolvedAt = new Date()`.

### Task 6: Passenger UI - Submission Button & Modal
- **Files:**
  - Modify: `app/user/booking/[id]/page.tsx`
- **Steps:**
  1. Detect if `booking.status === "COMPLETED"` or `"CANCELLED"`.
  2. Add "Report an Issue" / "অভিযোগ করুন" red outlined button.
  3. Implement Dialog/Modal containing Radio group of the 5 predefined reasons.
  4. Implement Textarea for details (mandated if "Other" is checked).
  5. Hook up form submit with `react-hook-form` to POST `/api/booking/[id]/report` and show Toast success notification.

### Task 7: Admin UI Hook State Integration
- **Files:**
  - Modify: `app/admin/hooks/useAdminDashboard.ts`
- **Steps:**
  1. Add `"issues"` to `AdminTab` union type.
  2. Declare hook state variables for issues (list, page, filter, meta, modal states).
  3. Implement `fetchIssues()` and hook it to a `useEffect` that fires when `activeTab === "issues"` or `issuesFilter`/`issuesPage` updates.
  4. Implement `handleResolveIssue()` to submit resolution notes.

### Task 8: Admin Panel Navigation Integration
- **Files:**
  - Modify: `app/admin/components/shared/TabNavigation.tsx`
  - Modify: `app/admin/AdminDashboard.tsx`
- **Steps:**
  1. Register `"issues"` inside `TabNavigation.tsx` typing.
  2. Import Lucide `AlertTriangle` icon.
  3. Append the "Issues" tab object to the `tabs` array with the label "Issues" or "অভিযোগ".
  4. Add conditional tab rendering for `"issues"` pointing to `<IssuesTab />`.

### Task 9: Admin Issues Component & Resolution Modal
- **Files:**
  - Create: `app/admin/components/tabs/IssuesTab.tsx`
  - Create: `app/admin/components/shared/IssueResolutionModal.tsx`
- **Steps:**
  1. Build a clean, search-enabled table in `IssuesTab.tsx`.
  2. Support active filtering by Open/Resolved status.
  3. Click rows to open `IssueResolutionModal.tsx` containing the passenger/driver details, complaint description, and resolution textarea.
  4. Hook up submit to trigger resolution, close modal, and refresh list.
