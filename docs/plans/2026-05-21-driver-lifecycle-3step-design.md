# Driver Trip Lifecycle 3-Step Sequence Design Doc

We are evolving the driver trip lifecycle sequence from a 2-button flow to a 3-button flow to support accurate ride tracking and precise transition metrics.

## Approved Trip Lifecycle
```
PENDING → ACCEPTED → ARRIVED → PICKED_UP → COMPLETED
                  ↘            ↘            
               CANCELLED    CANCELLED
```

## State Progression & Action Grid

| Current State | Action Button Text | API Endpoint called | Success State |
|---|---|---|---|
| **ACCEPTED** (En Route) | "আমি পৌঁছেছি" (I Arrived) | `/api/driver/arrived` | **ARRIVED** |
| **ARRIVED** (Waiting for Passenger) | "যাত্রা শুরু করুন" (Start Trip) | `/api/driver/start` | **PICKED_UP** |
| **PICKED_UP** (In Progress) | "ট্রিপ শেষ করুন" (Complete Trip) | `/api/driver/complete` | **COMPLETED** |

---

## Architectural Details

### 1. Backend Guard Validation (`app/api/driver/complete/route.ts`)
*   Restrict the transition to `COMPLETED` so that it is only allowed when the booking status is `PICKED_UP`.
*   Maintain the platform fee and wallet deduction logic exactly as it is today.

### 2. Driver Dashboard (`app/driver/dashboard/page.tsx`)
*   Add `handleStart` callback using `useCallback` to POST to `/api/driver/start`.
*   Evolve UI cards:
    *   **ACCEPTED Card:** Primary button: `i_arrived` ("আমি পৌঁছেছি").
    *   **ARRIVED Card:** Primary button: `start_trip` ("যাত্রা শুরু করুন").
    *   **PICKED_UP Card:** Primary button: `complete_ride` ("ট্রিপ শেষ করুন"). Contains `GoogleMapPreview` showing route to drop location.

### 3. Translation Dictionary (`constants/text.ts`)
*   Ensure all necessary keys are present:
    *   `i_arrived`: `"আমি পৌঁছেছি" / "I Arrived"`
    *   `start_trip`: `"যাত্রা শুরু করুন" / "Start Trip"`
    *   `complete_ride`: `"ট্রিপ শেষ করুন" / "Complete Trip"`
    *   `trip_started`: `"রাইড শুরু হয়েছে" / "Trip Started"`

### 4. Passenger Booking Page (`app/user/booking/[id]/page.tsx`)
*   The passenger UI already correctly maps `PICKED_UP` state to `"TRIP_IN_PROGRESS"` and `ARRIVED` to `"DRIVER_ARRIVED"`, displaying beautiful, localized status cards and custom road animations.

---

## Verification Plan

### Automated Verification
*   Compile/Typecheck: `npx tsc --noEmit` must return zero errors.
*   Formatting/Linting check.

### Manual Verification
*   Complete a test trip using the user and driver flows sequentially.
*   Verify correct status updates broadcast in real-time between driver and passenger screens.
