# Design Document: Issue Reports (Passenger Complaints & Admin Resolution)

**Date:** 2026-05-17
**Status:** Approved
**Topic:** Passenger complaint box on trip completion/cancellation and dynamic admin resolution ledger.
**Parent Issue:** CNGLagbe Admin Panel Missing Features & Statistics

---

## 🎯 Goal & Core Promise

CNGLagbe is a lightweight "On-time CNG Booking Service" operating as a trust-focused, transparent ride arrangement service. To maintain high accountability of drivers and passenger safety, we need a post-trip complaint management pipeline. 

This design implements a lightweight **Issue Reports (অভিযোগ বক্স)** system which allows passengers to report driver behavior or trip anomalies on completed or cancelled bookings, and allows admins to track, inspect, comment, and resolve these issues dynamically from a central dashboard.

### Operational Boundaries (System Identity Alignment)
- **No live chat:** Passenger complains via form modal; no in-app live chat support is added.
- **No digital gateways:** Admin resolves disputes manually/offline, and logs the decision.
- **Limited Scope:** Responsibility covers from booking acceptance to completion. Issue reports act as post-trip accountability ledger.

---

## 💾 Section A: Database Schema Migrations

We modify the existing `IssueReport` model in [schema.prisma](file:///Users/patwary/Projects/CNGLagbe/prisma/schema.prisma) to add columns for resolution details and indexes for query performance.

### Prisma Schema Diff
```diff
model IssueReport {
  id             String    @id @default(cuid())
  bookingId      String
  userId         String
  reason         String
  details        String?
  status         String    @default("OPEN") // "OPEN", "RESOLVED"
+ resolutionNote String?   // Admin resolution notes/decision
+ resolvedAt     DateTime? // Timestamp when resolved
  createdAt      DateTime  @default(now())
  booking        Booking   @relation(fields: [bookingId], references: [id])
+
+ @@index([status])
+ @@index([createdAt])
}
```

### Migration Command
```bash
npx prisma migrate dev --name add_resolution_to_issue_report
```

---

## 🔌 Section B: API Endpoints

We define 3 new API endpoints for submitting, listing, and resolving issue reports.

### 1. Passenger: Submit Issue Report
- **Endpoint:** `POST /api/booking/[id]/report`
- **Authentication:** Passenger only (`session.userId === booking.userId`)
- **Payload:**
  ```json
  {
    "reason": "DRIVED_DEMANDED_EXTRA_MONEY",
    "details": "ড্রাইভার ফিক্সড ভাড়া ২৫০ টাকার বদলে ৩৫০ টাকা চেয়েছে এবং অত্যন্ত খারাপ আচরণ করেছে।"
  }
  ```
- **Validation Rules:**
  - `reason` must be one of predefined enum strings.
  - `details` is optional for other reasons, but mandatory if `reason === "OTHER"`.
  - Booking status must be `COMPLETED` or `CANCELLED`.

### 2. Admin: List Issue Reports
- **Endpoint:** `GET /api/admin/issues`
- **Authentication:** Admin only (`getAuthenticatedAdmin()`)
- **Query Params:**
  - `status`: `"ALL" | "OPEN" | "RESOLVED"` (Default: `"OPEN"`)
  - `page`: `number` (Default: `1`)
  - `limit`: `number` (Default: `20`)
- **Response Shape:**
  ```json
  {
    "issues": [
      {
        "id": "cuid...",
        "status": "OPEN",
        "reason": "DRIVED_DEMANDED_EXTRA_MONEY",
        "details": "...",
        "createdAt": "2026-05-17T08:00:00Z",
        "booking": {
          "id": "booking_id",
          "fare": 250,
          "status": "COMPLETED",
          "user": { "name": "Abir", "phone": "017..." },
          "driver": { "name": "Kalam", "phone": "018..." }
        }
      }
    ],
    "meta": { "total": 1, "totalPages": 1 }
  }
  ```

### 3. Admin: Resolve Issue Report
- **Endpoint:** `POST /api/admin/issues/[id]/resolve`
- **Authentication:** Admin only
- **Payload:**
  ```json
  {
    "resolutionNote": "ড্রাইভারকে ফোন করা হয়েছে। অতিরিক্ত ভাড়ার ব্যাপারে সতর্ক করে সতর্কীকরণ নোটিশ দেওয়া হলো।"
  }
  ```
- **Logic:**
  - Mark status as `"RESOLVED"`.
  - Save `resolutionNote`.
  - Save `resolvedAt = new Date()`.

---

## 🎨 Section C: Passenger UI Design (Submission)

### Trigger
Located on the Booking Details page ([app/user/booking/[id]/page.tsx](file:///Users/patwary/Projects/CNGLagbe/app/user/booking/%5Bid%5D/page.tsx)), next to the trip overview card:
- Displays a prominent red-tinted bordered button: **"Report an Issue" (অভিযোগ করুন)**.
- Displayed only when `booking.status` is `COMPLETED` or `CANCELLED`.

### Submission Modal
A lightweight, fast-loading modal window:
- **Title:** "অভিযোগ দায়ের করুন" (Report an Issue)
- **Predefined Options (Radio Selection):**
  1. ৳ ড্রাইভার অতিরিক্ত ভাড়া দাবি করেছে (Driver demanded extra money)
  2. ⏳ ড্রাইভার সময়মত পিকআপ লোকেশনে আসেনি (Driver did not arrive on time)
  3. 👤 ড্রাইভার খারাপ আচরণ করেছে (Driver behaved poorly)
  4. 🎒 সিএনজিতে জিনিসপত্র হারিয়ে গেছে (Lost items in vehicle)
  5. ⚙️ অন্যান্য (Other)
- **Textarea:** "অভিযোগের বিস্তারিত বিবরণ লিখুন..." (Required only if "Other" is chosen; optional otherwise).
- **Actions:** "অভিযোগ জমা দিন" (Submit Report) with loading states and "বাতিল" (Cancel) button.

---

## 🎨 Section D: Admin UI Design (Resolution Dashboard)

### Tab Integration
Added as a first-class tab in the Admin Panel (`app/admin/components/tabs/IssuesTab.tsx`).
- URL routing integration via `?tab=issues`.
- Live counter showing number of `OPEN` issues (e.g., **Issues (3)** in red badge).

### List Layout
- Filter dropdown to switch between: "চলতি অভিযোগ" (Open), "মীমাংসিত" (Resolved), and "সব অভিযোগ" (All).
- Search input to search by Driver name, Passenger name, or Phone number.
- High-contrast table showing: Issue ID, Submitter User, Accused Driver, Selected Reason, Date, and Status badge.

### Resolution Modal
Clicking on any issue row opens the **Issue Review Modal**:
- **Metadata Section:** Full Passenger info (Name, Phone link), Driver info (Name, Phone link, Driver Profile link), and Booking ID link.
- **Content Section:** Displays the selected Predefined Reason and the optional passenger's details description text in a highlighted container.
- **Action Form:**
  - Textarea: "অ্যাডমিন সমাধান নোট" (Admin Resolution Note) with a placeholder "কী পদক্ষেপ নেওয়া হয়েছে তা লিখুন..." (Required to resolve).
  - Primary button: "অভিযোগের সমাধান করুন" (Mark as Resolved) — changes status to resolved, saves note, and triggers list refresh.

---

## 🧪 Verification Plan

### 1. Manual E2E Validation
- Book a ride → Complete it → Go to Booking details page.
- Verify "Report an Issue" button is visible.
- Click it, select reason, write details, and submit. Verify success toast and modal closing.
- Log in as Admin → Open `/admin?tab=issues`.
- Verify the newly created issue is visible in the Open list with correct relations (driver & user details).
- Click the issue to open the Resolution modal.
- Enter resolution note and click "Mark as Resolved".
- Verify the issue changes to green "RESOLVED" status, vanishes from the "Open" filter list, and is visible in the "Resolved" filter list with the saved notes.

### 2. Integrity Checks
- Attempting to submit report for another user's booking → Should fail with `403 Forbidden`.
- Attempting to submit report without mandatory description when "Other" is selected → Should fail validation.
- Admin attempting to resolve an issue with an empty resolution note → Should show error.
