# Driver Lifecycle Fix — Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Fix the entire `ACCEPTED → ARRIVED → COMPLETED` trip lifecycle so that the ARRIVED state actually exists, location tracking works during active bookings, and the driver UI shows exactly 2 action buttons per ride.

**Architecture:** The `ARRIVED` status is added as a real database state. The backend `/api/driver/arrived` route is fixed to set `ARRIVED` (not `PICKED_UP`). The `/api/driver/complete` route is updated to accept `ARRIVED` status directly, skipping `PICKED_UP` (no mileage meter needed — fare is fixed). The frontend driver dashboard renders 3 distinct booking cards: ACCEPTED (en route), ARRIVED (waiting for passenger), and COMPLETED modal. `PICKED_UP` is retained in the schema for historical compatibility but is no longer used in new trips.

**Tech Stack:** Next.js App Router, Prisma ORM, PostgreSQL (Supabase), TypeScript, TanStack Query, Supabase Realtime, `constants/text.ts` for all UI strings.

---

## Revised Trip Lifecycle (After Fix)

```
PENDING → ACCEPTED → ARRIVED → COMPLETED
                  ↘            ↘
               CANCELLED    CANCELLED
```

| Driver Action | Button Label | API Called | Status Set |
|--------------|--------------|------------|------------|
| Accepts ride | Accept | `/api/driver/accept` | ACCEPTED |
| Reaches pickup | "আমি পৌঁছেছি" | `/api/driver/arrived` | ARRIVED + arrivedAt |
| Passenger pays | "ট্রিপ শেষ করুন" | `/api/driver/complete` | COMPLETED |

---

## Task 1: Add `arrivedAt` to Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1:** Open `prisma/schema.prisma`. In the `Booking` model, add `arrivedAt` after `acceptedAt`:

```prisma
acceptedAt     DateTime?
arrivedAt      DateTime?   // ← ADD THIS LINE
startedAt      DateTime?
```

**Step 2:** Run migration:

```bash
npx prisma db push
npx prisma generate
```

Expected output: `✓ Your database is now in sync with your Prisma schema.`

---

## Task 2: Update TypeScript Types

**Files:**
- Modify: `lib/types/booking.ts`

**Step 1:** Update `BookingStatus` to include `"ARRIVED"`:

```typescript
export type BookingStatus =
  | "PENDING"
  | "ACCEPTED"
  | "ARRIVED"      // ← ADD
  | "PICKED_UP"
  | "COMPLETED"
  | "CANCELLED"
  | "TIMED_OUT";
```

**Step 2:** Update `BookingUiState` to include `"DRIVER_ARRIVED"`:

```typescript
export type BookingUiState =
  | "FINDING_DRIVER"
  | "DRIVER_ASSIGNED"
  | "DRIVER_ARRIVED"    // ← ADD
  | "TRIP_IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "TIMED_OUT";
```

**Step 3:** Add `arrivedAt` to the `Booking` interface:

```typescript
acceptedAt?: string | null;
arrivedAt?: string | null;    // ← ADD after acceptedAt
startedAt?: string | null;
```

---

## Task 3: Update `getBookingUiState()` in `lib/booking-utils.ts`

**Files:**
- Modify: `lib/booking-utils.ts`

**Step 1:** Add `"ARRIVED"` case to the switch statement (after line 27):

```typescript
case "ACCEPTED":
  return "DRIVER_ASSIGNED";
case "ARRIVED":           // ← ADD THESE 2 LINES
  return "DRIVER_ARRIVED";
case "PICKED_UP":
  return "TRIP_IN_PROGRESS";
```

---

## Task 4: Update Translation Dictionary

**Files:**
- Modify: `constants/text.ts`

**Step 1:** Fix `i_arrived` label (currently wrong — shows "Ride Start"):

Find line:
```typescript
i_arrived: { en: "Ride Start", bn: "যাত্রা শুরু" },
```
Replace with:
```typescript
i_arrived: { en: "I Arrived", bn: "আমি পৌঁছেছি" },
```

**Step 2:** Add `complete_ride` key directly after `i_arrived`:

```typescript
complete_ride: { en: "Complete Trip", bn: "ট্রিপ শেষ করুন" },
```

**Step 3:** Add `driver_arrived_wait` key (for the ARRIVED card status label). Find a suitable location near `driver_arrived` (around line 304) and add:

```typescript
driver_arrived_wait: { en: "Waiting for passenger", bn: "যাত্রীর জন্য অপেক্ষা" },
```

---

## Task 5: Fix `/api/driver/arrived/route.ts`

**Files:**
- Modify: `app/api/driver/arrived/route.ts`

**Step 1:** Replace the entire `prisma.booking.update` call (lines 36-47) with:

```typescript
const result = await prisma.booking.update({
  where: { id: bookingId },
  data: {
    status: "ARRIVED",
    arrivedAt: new Date(),
  },
});

// Broadcast ARRIVED status to passenger
broadcastStatusChange(bookingId, "ARRIVED");
```

Note: Remove the `driver: { update: { isOnline: false } }` block — driver is already offline from accept step.

**Step 2:** Verify the status guard above it still reads `"ACCEPTED"`:
```typescript
if (booking.status !== "ACCEPTED") {
  return NextResponse.json({ error: "Booking must be ACCEPTED to mark as arrived" }, { status: 400 });
}
```
This is correct — keep it.

---

## Task 6: Fix `/api/driver/complete/route.ts`

**Files:**
- Modify: `app/api/driver/complete/route.ts`

**Step 1:** Change the status validation guard (line 29) from:

```typescript
if (booking.status !== "PICKED_UP") {
```

To:

```typescript
if (booking.status !== "ARRIVED" && booking.status !== "PICKED_UP") {
```

This allows completion from both `ARRIVED` (new flow) and `PICKED_UP` (legacy data compatibility).

---

## Task 7: Fix `/api/driver/location/route.ts` — Unblock During Active Bookings

**Files:**
- Modify: `app/api/driver/location/route.ts`

**Step 1:** Replace the raw SQL `WHERE` clause. Find:

```sql
WHERE "id" = ${driverId}
  AND "isOnline" = true
```

Replace with:

```sql
WHERE "id" = ${driverId}
  AND (
    "isOnline" = true
    OR EXISTS (
      SELECT 1 FROM "Booking"
      WHERE "driverId" = ${driverId}
        AND "status" IN ('ACCEPTED', 'ARRIVED', 'PICKED_UP')
    )
  )
```

---

## Task 8: Fix `/api/sync/route.ts` — Include `ARRIVED` in Status Arrays

**Files:**
- Modify: `app/api/sync/route.ts`

**Step 1:** Fix driver `currentBookingPromise` (around line 111):

```typescript
status: { in: ["ACCEPTED", "ARRIVED", "PICKED_UP"] },  // ← add "ARRIVED"
```

**Step 2:** Add `arrivedAt` to the `currentBookingPromise` select fields (after `acceptedAt` if present, otherwise add it):

```typescript
select: {
  id: true,
  status: true,
  pickupLat: true,
  // ... other fields ...
  arrivedAt: true,   // ← ADD
  // ... rest of fields ...
}
```

**Step 3:** Fix user `activeBooking` query (around line 43):

```typescript
status: { in: ["PENDING", "ACCEPTED", "ARRIVED", "PICKED_UP"] },  // ← add "ARRIVED", "PICKED_UP"
```

---

## Task 9: Fix `/api/booking/active/route.ts`

**Files:**
- Modify: `app/api/booking/active/route.ts`

**Step 1:** Fix the status array (line 37):

```typescript
status: { in: ["PENDING", "ACCEPTED", "ARRIVED", "PICKED_UP"] },  // ← add "ARRIVED"
```

---

## Task 10: Fix `/api/driver/accept/route.ts` — Stale Active Booking Guard

**Files:**
- Modify: `app/api/driver/accept/route.ts`

**Step 1:** Fix the active booking check (line 26-28):

```typescript
const activeBooking = await tx.booking.findFirst({
  where: { driverId, status: { in: ["ACCEPTED", "ARRIVED", "PICKED_UP"] } }
});
```

---

## Task 11: Refactor Driver Dashboard — Trip Cards & Action Buttons

**Files:**
- Modify: `app/driver/dashboard/page.tsx`

This is the most significant frontend change. The goal is 3 distinct booking card states.

### Remove `isArrivedOptimistic` state

Delete `const [isArrivedOptimistic, setIsArrivedOptimistic] = useState(false);` and all references to it. The server status now drives the UI directly.

### Remove `arrivedBooking` useMemo

Delete the entire `arrivedBooking` useMemo block (lines 202-224). Replace all `arrivedBooking` references with `currentBooking`.

### Remove `syncOptimistic` useEffect

Delete the useEffect that syncs `isArrivedOptimistic` (lines 227-236).

### Update `handleArrived` callback

```typescript
const handleArrived = useCallback(async (id: string) => {
  try {
    const res = await apiFetch("/api/driver/arrived", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: id })
    });
    if (res.ok) {
      queryClient.invalidateQueries({ queryKey: ["driverSync"] });
    }
  } catch (e) {
    console.error(e);
  }
}, [queryClient]);
```

### Update `finishTrip` callback — now works from ARRIVED

```typescript
const finishTrip = useCallback(async () => {
  if (!currentBooking) return;
  try {
    const res = await apiFetch("/api/driver/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: currentBooking.id })
    });
    if (res.ok) {
      setIsOnlineOverride(null);
      queryClient.invalidateQueries({ queryKey: ["driverSync"] });
      toast.success(t("completed") as string);
    } else {
      toast.error(t("error") as string);
    }
  } catch (e) {
    console.error(e);
    toast.error(t("error") as string);
  }
}, [currentBooking, queryClient, t]);
```

### Replace the single ACCEPTED booking card with 2 state-based cards

**Delete** the existing `{currentBooking && currentBooking.status === "ACCEPTED" && (...)}` block (lines 825-957).

**Replace** with the following two blocks:

#### Card A — ACCEPTED State (Driver En Route)

```tsx
{currentBooking && currentBooking.status === "ACCEPTED" && (
  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
    <div className="flex items-center justify-between px-2">
      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        {t("ongoing")}
      </h3>
      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-black text-[10px] px-3">LIVE</Badge>
    </div>

    <Card className="border-none shadow-2xl shadow-blue-500/10 rounded-[2rem] bg-white overflow-hidden">
      <CardContent className="p-0">
        <div className="relative w-full h-64 bg-slate-100 overflow-hidden rounded-t-[2rem]">
          <GoogleMapPreview
            pickupLat={currentBooking.pickupLat}
            pickupLng={currentBooking.pickupLng}
            destLat={currentBooking.destLat}
            destLng={currentBooking.destLng}
            apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
            className="rounded-none"
          />
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={`https://www.google.com/maps/dir/?api=1&origin=${currentBooking.pickupLat},${currentBooking.pickupLng}&destination=${currentBooking.destLat},${currentBooking.destLng}&travelmode=driving`}
            className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 text-primary text-[10px] font-black uppercase bg-white px-3.5 py-2 rounded-full hover:bg-slate-50 transition-all shadow-md border border-slate-100/50"
          >
            <Navigation size={12} /> {t("nav_google_maps")}
          </a>
        </div>

        <div className="p-5 space-y-5">
          {/* Vertical timeline — pickup & drop */}
          <div className="relative space-y-5 before:absolute before:left-3 before:top-3 before:bottom-3 before:border-l before:border-dashed before:border-slate-200">
            <div className="flex gap-3 relative">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 z-10">
                <span className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-400 uppercase mb-0.5">{t("pickup")}</p>
                <p className="text-sm font-bold text-slate-800 truncate">
                  {simplifyAddress(currentBooking.pickupAddress) || t("pickup")}
                </p>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`https://www.google.com/maps/dir/?api=1&destination=${currentBooking.pickupLat},${currentBooking.pickupLng}`}
                  className="inline-flex items-center gap-1 text-blue-600 text-xs font-black uppercase mt-1 hover:underline"
                >
                  <ExternalLink size={10} /> {t("nav_pickup")}
                </a>
              </div>
            </div>

            <div className="flex gap-3 relative">
              <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center shrink-0 z-10">
                <span className="w-2 h-2 rounded-full bg-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-400 uppercase mb-0.5">{t("drop")}</p>
                <p className="text-sm font-bold text-slate-800 truncate">
                  {simplifyAddress(currentBooking.destAddress) || t("drop")}
                </p>
              </div>
            </div>
          </div>

          {/* Fare strip */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase mb-0.5 flex items-center gap-1">
                <Banknote size={12} /> {t("collect_cash")}
              </p>
              <p className="text-2xl font-black text-slate-800">{t("currency")}{formatDecimal(currentBooking.totalFare || currentBooking.fare)}</p>
            </div>
            <Badge variant="outline" className="border-primary/20 text-primary font-black text-xs uppercase px-2.5 py-0.5 bg-primary/5">{t("cash_only")}</Badge>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-1">
            {currentBooking.user?.phone && (
              <AppButton
                onClick={() => window.location.href = `tel:${currentBooking.user?.phone}`}
                variant="outline"
                className="w-full h-14 text-sm font-black rounded-2xl border-slate-200 hover:bg-slate-50 text-slate-800"
                leftIcon={<Phone size={18} className="text-primary" />}
              >
                {t("call_user")} {currentBooking.user?.name ? `- ${currentBooking.user.name}` : ""}
              </AppButton>
            )}

            <AppButton
              onClick={() => handleArrived(currentBooking.id)}
              className="w-full h-14 text-sm font-black rounded-2xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white"
              leftIcon={<CheckCircle2 size={18} />}
            >
              {t("i_arrived")}
            </AppButton>

            <AppButton
              variant="ghost"
              onClick={() => setShowCancel(true)}
              className="w-full h-10 text-red-500 hover:text-red-600 hover:bg-red-50/50 text-xs font-black rounded-xl transition-colors"
            >
              {t("cancel_booking")}
            </AppButton>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
)}
```

#### Card B — ARRIVED State (Waiting for Passenger)

```tsx
{currentBooking && currentBooking.status === "ARRIVED" && (
  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
    <div className="flex items-center justify-between px-2">
      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        {t("driver_arrived")}
      </h3>
      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-black text-[10px] px-3">ARRIVED</Badge>
    </div>

    <Card className="border-none shadow-2xl shadow-emerald-500/10 rounded-[2rem] bg-white overflow-hidden">
      <CardContent className="p-5 space-y-5">
        {/* Arrived banner */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-black text-emerald-700 uppercase tracking-widest">{t("driver_arrived")}</p>
            <p className="text-sm font-bold text-slate-600">{t("driver_arrived_wait")}</p>
          </div>
        </div>

        {/* Pickup & Drop timeline */}
        <div className="relative space-y-5 before:absolute before:left-3 before:top-3 before:bottom-3 before:border-l before:border-dashed before:border-slate-200">
          <div className="flex gap-3 relative">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 z-10">
              <span className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-400 uppercase mb-0.5">{t("pickup")}</p>
              <p className="text-sm font-bold text-slate-800 truncate">
                {simplifyAddress(currentBooking.pickupAddress) || t("pickup")}
              </p>
            </div>
          </div>
          <div className="flex gap-3 relative">
            <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center shrink-0 z-10">
              <span className="w-2 h-2 rounded-full bg-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-400 uppercase mb-0.5">{t("drop")}</p>
              <p className="text-sm font-bold text-slate-800 truncate">
                {simplifyAddress(currentBooking.destAddress) || t("drop")}
              </p>
            </div>
          </div>
        </div>

        {/* Fare strip */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase mb-0.5 flex items-center gap-1">
                <Banknote size={12} /> {t("collect_cash")}
              </p>
              <p className="text-2xl font-black text-slate-800">{t("currency")}{formatDecimal(currentBooking.totalFare || currentBooking.fare)}</p>
            </div>
            <Badge variant="outline" className="border-primary/20 text-primary font-black text-xs uppercase px-2.5 py-0.5 bg-primary/5">{t("cash_only")}</Badge>
          </div>
          <div className="pt-3 border-t border-slate-200/60 flex flex-col gap-2 mt-3">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500">
              <span>{t("fare")}</span>
              <span>{t("currency")}{formatDecimal(currentBooking.baseFare || currentBooking.fare)}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold text-slate-500">
              <span>{t("platform_fee")}</span>
              <span>{t("currency")}{formatDecimal(currentBooking.platformFee || 0)}</span>
            </div>
          </div>
        </div>

        {/* Actions — only 2 buttons */}
        <div className="flex flex-col gap-3 pt-1">
          {currentBooking.user?.phone && (
            <AppButton
              onClick={() => window.location.href = `tel:${currentBooking.user?.phone}`}
              variant="outline"
              className="w-full h-14 text-sm font-black rounded-2xl border-slate-200 hover:bg-slate-50 text-slate-800"
              leftIcon={<Phone size={18} className="text-primary" />}
            >
              {t("call_user")} {currentBooking.user?.name ? `- ${currentBooking.user.name}` : ""}
            </AppButton>
          )}

          <AppButton
            onClick={finishTrip}
            className="w-full h-16 text-lg font-black rounded-2xl shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-white"
            leftIcon={<CheckCircle2 size={24} />}
          >
            {t("complete_ride")}
          </AppButton>
        </div>
      </CardContent>
    </Card>
  </div>
)}
```

### Remove the old full-screen `arrivedBooking` modal

Delete the entire block from line 995 to 1043 (the `{arrivedBooking && (...)}` fixed overlay).

---

## Task 13: Fix User Booking Page — Add `DRIVER_ARRIVED` UI & Fix Wait Timer

**Files:**
- Modify: `app/user/booking/[id]/page.tsx`

### Step 1: Fix the 15-minute wait countdown

Find lines 300-308 (the `diffMinutes` and `remainingWaitSeconds` calculations). Replace with:

```typescript
// Use arrivedAt if available, fallback to acceptedAt for legacy bookings
const waitStartTime = booking.arrivedAt || booking.acceptedAt;
const diffMinutes = waitStartTime
  ? Math.max(0, Math.floor((now - new Date(waitStartTime).getTime()) / (1000 * 60)))
  : 0;
const canCancelAfterAccept =
  uiState === "FINDING_DRIVER" ||
  (uiState === "DRIVER_ARRIVED" && diffMinutes >= 15) ||
  (uiState === "DRIVER_ASSIGNED" && diffMinutes >= 15);

const remainingWaitSeconds = waitStartTime
  ? Math.max(0, 15 * 60 - Math.floor((now - new Date(waitStartTime).getTime()) / 1000))
  : 0;
```

### Step 2: Update countdown timer `useEffect` to also tick for ARRIVED

Find the `if (!isPending && !isAccepted) return;` guard (around line 145). Replace with:

```typescript
const isArrived = booking.status === "ARRIVED";
if (!isPending && !isAccepted && !isArrived) return;
```

### Step 3: Add `DRIVER_ARRIVED` rendering block

Add this block **between** the `DRIVER_ASSIGNED` block and the `TRIP_IN_PROGRESS` block (after line 622):

```tsx
{/* ── DRIVER ARRIVED STATE ──────────────────────────────────── */}
{uiState === "DRIVER_ARRIVED" && booking.driver && (
  <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
    {/* Arrived Header */}
    <div className="bg-emerald-600 px-5 py-4 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          <CheckCircle2 size={18} className="text-white" />
        </div>
        <div>
          <p className="text-xs font-black text-white/70 uppercase tracking-widest">{t("driver_arrived")}</p>
          <p className="text-sm font-black text-white">{booking.driver.name}</p>
        </div>
      </div>
      {booking.driver.vehicleNumber && (
        <div className="license-plate scale-90">
          <span className="text-[10px] font-black bg-slate-900 text-white px-1.5 rounded-sm mr-1">CNG</span>
          {booking.driver.vehicleNumber}
        </div>
      )}
    </div>

    <div className="p-6 space-y-6">
      {/* Arrived Message */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
        <p className="text-sm font-black text-emerald-800">{t("driver_arrived_info")}</p>
      </div>

      {/* Fare & Distance */}
      <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t("fare")}</span>
          <div className="space-y-0.5">
            <p className="text-[9px] font-bold text-slate-500 leading-tight">{t("fare")}: {t("currency")}{formatDecimal(booking.baseFare || booking.fare)}</p>
            <p className="text-[9px] font-bold text-slate-500 leading-tight">{t("platform_fee")}: {t("currency")}{formatDecimal(booking.platformFee || 0)}</p>
            <p className="text-base font-black text-slate-900">{t("currency")}{formatDecimal(booking.totalFare || booking.fare)}</p>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t("distance")}</span>
          <p className="text-base font-black text-slate-900">{booking.distance.toFixed(1)}{t("km_unit")}</p>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t("time")}</span>
          <p className="text-base font-black text-slate-900">{timeValue}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <a
          href={`tel:${booking.driver.phone}`}
          className="flex h-16 items-center justify-center gap-3 rounded-2xl bg-primary text-base font-black text-white transition-all shadow-xl shadow-primary/25 hover:bg-primary-dark active:scale-[0.98]"
        >
          <Phone size={20} fill="currentColor" />
          {t("call_driver")}
        </a>

        {canCancelAfterAccept && (
          <AppButton
            variant="secondary"
            onClick={() => setShowCancel(true)}
            className="h-14 rounded-2xl border-2 border-slate-100 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-red-500 hover:border-red-100 hover:bg-red-50/50 transition-all"
          >
            {t("cancel_booking")}
          </AppButton>
        )}

        {!canCancelAfterAccept && (
          <p className="text-[10px] font-black text-slate-400 text-center uppercase tracking-widest mt-2 bg-slate-50 py-3 rounded-xl border border-dashed border-slate-200">
            {t("cancel_available_in")} {formatDuration(remainingWaitSeconds, "0:00")}
          </p>
        )}
      </div>
    </div>
  </div>
)}
```

### Step 4: Show driver card and map for DRIVER_ARRIVED

Find line 292-293:
```typescript
const showCancelAction = uiState === "FINDING_DRIVER" || uiState === "DRIVER_ASSIGNED";
const showDriverCard = (uiState === "DRIVER_ASSIGNED" || uiState === "COMPLETED") && Boolean(booking.driver);
```

Update to:
```typescript
const showCancelAction = uiState === "FINDING_DRIVER" || uiState === "DRIVER_ASSIGNED" || uiState === "DRIVER_ARRIVED";
const showDriverCard = (uiState === "DRIVER_ASSIGNED" || uiState === "DRIVER_ARRIVED" || uiState === "COMPLETED") && Boolean(booking.driver);
```

### Step 5: Fix Realtime location listener

Find line 206:
```typescript
if (booking.status === "ACCEPTED") {
```
Change to:
```typescript
if (booking.status === "ACCEPTED" || booking.status === "ARRIVED") {
```

### Step 6: Update map init `useEffect` to also trigger for `DRIVER_ARRIVED`

Find line 219-220:
```typescript
const uiState = getBookingUiState(booking, countdown);
if (uiState !== "DRIVER_ASSIGNED") return;
```
Change to:
```typescript
const uiState = getBookingUiState(booking, countdown);
if (uiState !== "DRIVER_ASSIGNED" && uiState !== "DRIVER_ARRIVED") return;
```

### Step 7: Update PageHeading title logic

Find around line 361:
```typescript
(uiState === "FINDING_DRIVER" || uiState === "DRIVER_ASSIGNED")
```
Change to:
```typescript
(uiState === "FINDING_DRIVER" || uiState === "DRIVER_ASSIGNED" || uiState === "DRIVER_ARRIVED")
```

---

## Task 14: Update `taste.md`

**Files:**
- Modify: `taste.md`

Add the following entry under the `🧑‍✈️ Driver Dashboard` section:

```markdown
- **Simplified 2-Button Trip Lifecycle (2026-05-21):** The driver trip flow uses exactly 2 action buttons per ride: "আমি পৌঁছেছি" (I Arrived → sets ARRIVED status) and "ট্রিপ শেষ করুন" (Complete Trip → sets COMPLETED directly from ARRIVED). There is NO "Start Ride" / "PICKED_UP" step in the UI. The ARRIVED → COMPLETED direct transition is intentional — fare is fixed, no mileage meter needed. The full-screen blocking fare modal has been replaced with an inline ARRIVED card that keeps map and navigation accessible. The `isArrivedOptimistic` pattern has been removed; server status drives all UI transitions.
```

---

## Task 15: TypeScript Verification

**Step 1:** Run TypeScript compiler check:

```bash
npx tsc --noEmit
```

Expected: zero errors.

If errors appear related to `arrivedAt` being used but not in type, verify Task 2 was completed correctly.

---

## Verification Checklist

- [ ] `npx prisma db push` completed without errors
- [ ] `npx tsc --noEmit` shows zero errors
- [ ] Driver accepts → GPS tracking stays active throughout trip
- [ ] Driver clicks "আমি পৌঁছেছি" → status becomes `ARRIVED` in DB, `arrivedAt` recorded
- [ ] Passenger sees "Driver Arrived" banner after driver clicks arrived
- [ ] 15-min cancellation countdown counts from `arrivedAt`, not `acceptedAt`
- [ ] Driver clicks "ট্রিপ শেষ করুন" → status becomes `COMPLETED`, driver goes online, wallet deducted
- [ ] Driver dashboard shows correct card for each status (ACCEPTED, ARRIVED)
- [ ] No full-screen modal blocking driver during active trip
- [ ] Location continues to update in DB during ARRIVED state
