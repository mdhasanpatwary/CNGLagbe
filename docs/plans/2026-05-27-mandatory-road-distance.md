# Mandatory Road Distance Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Remove the Haversine formula fallback for passenger fare calculations and strictly mandate Google Maps actual road distance validation on `/api/fare/calculate` and `/api/booking/create` endpoints to prevent incorrect/underestimated fares.

**Architecture:** 
1. Update `lib/fare.ts` to add clear warnings to `calculateDistance` (retained only for driver geospatial proximity search).
2. Refactor `/api/fare/calculate` to strictly validate `distance` and throw a `400` error if it is missing or <= 0.
3. Refactor `/api/booking/create` to strictly validate `distance` and throw a `400` error if it is missing or <= 0.

**Tech Stack:** Next.js (App Router), TypeScript, Prisma.

---

### Task 1: Warn on Haversine in `lib/fare.ts`

**Files:**
- Modify: `lib/fare.ts`

**Step 1: Write warning comments**
Add a strict warning comment block to `calculateDistance` in `lib/fare.ts` explaining that it must never be used for fare calculation.

**Step 2: Verify compile**
Verify there are no TypeScript compile errors:
Run: `npx tsc --noEmit` (if permission allowed) or check Next.js log.

---

### Task 2: Validate `distance` in `/api/fare/calculate`

**Files:**
- Modify: `app/api/fare/calculate/route.ts`

**Step 1: Write validation logic**
Replace the fallback Haversine distance logic with:
```typescript
    if (distance === undefined || distance === null || typeof distance !== "number" || distance <= 0) {
      return NextResponse.json(
        { 
          error: "Missing road distance", 
          message: "Actual driving road distance is required for fare calculation." 
        }, 
        { status: 400 }
      );
    }
```
And remove the import and call of `calculateDistance`.

**Step 2: Verify compile**
Verify TypeScript compilation.

---

### Task 3: Validate `distance` in `/api/booking/create`

**Files:**
- Modify: `app/api/booking/create/route.ts`

**Step 1: Write validation logic**
Replace the fallback Haversine distance logic with:
```typescript
      if (distance === undefined || distance === null || typeof distance !== "number" || distance <= 0) {
        return NextResponse.json(
          { 
            error: "Missing road distance", 
            message: "Actual driving road distance is required for fare calculation." 
          }, 
          { status: 400 }
        );
      }
```
And remove the usage of `calculateDistance` for calculating the passenger's fare.

**Step 2: Verify compile**
Verify TypeScript compilation.

---

### Task 4: Verify APIs Manually

**Step 1: Test `/api/fare/calculate` with missing distance**
Make a POST request to `/api/fare/calculate` without `distance` in the payload and verify it returns `400 Bad Request` with our custom error JSON.

**Step 2: Test `/api/booking/create` with missing distance**
Make a POST request to `/api/booking/create` without `distance` in the payload and verify it returns `400 Bad Request` with our custom error JSON.
