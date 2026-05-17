# New Booking Modal UI/UX Upgrades Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Improve the UI/UX, visual spacing, and screen-efficiency of the Incoming Booking Request Modal on the driver dashboard.

**Architecture:** Redesign the modal element inside `app/driver/dashboard/page.tsx` into a highly optimized, single-viewport card deck layout by removing coordinate noise, integrating floating map control badges, and applying high-end glassmorphism borders and gradient layers.

**Tech Stack:** React, Next.js, Tailwind CSS, Lucide icons, AppButton design tokens.

---

### Task 1: Redesign the Incoming Booking Request Modal UI/UX

**Files:**
- Modify: `app/driver/dashboard/page.tsx:1047-1150`

**Step 1: Write minimal implementation changes**
Open [app/driver/dashboard/page.tsx](file:///Users/patwary/Projects/CNGLagbe/app/driver/dashboard/page.tsx) and update the incoming request modal code structure with the new premium card deck styling, horizontal split pricing row, floating map button overlay, zero-noise timeline, and compact actions.

**Step 2: Verify lint rules and compilation**
Run: `yarn lint` and `npx tsc --noEmit --skipLibCheck`
Expected: Done with no errors or warnings.

**Step 3: Commit**
```bash
git add app/driver/dashboard/page.tsx
git commit -m "style: upgrade incoming booking request modal to premium unified card deck"
```
