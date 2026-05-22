# Driver Trip Lifecycle 3-Step Sequence Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement the complete 3-step trip lifecycle for drivers (ACCEPTED → ARRIVED → PICKED_UP → COMPLETED), disabling passenger cancellation during the active ride, and showing state-based trip cards on the driver dashboard.

**Architecture:** We will restrict trip completion in the backend `/api/driver/complete` route to require the booking to be in the `PICKED_UP` state. We will add a `handleStart` callback in the driver's dashboard that calls `/api/driver/start` to mark the booking as `PICKED_UP`. We will render three distinct state-based trip cards in the driver's dashboard for `ACCEPTED` (En Route), `ARRIVED` (Waiting for Passenger), and `PICKED_UP` (Active Trip with route to destination). On the user/passenger side, cancellation is disabled as soon as the trip transitions to the active/picked up status.

**Tech Stack:** Next.js, Prisma ORM, TypeScript, TailwindCSS, `constants/text.ts` for translations.

---

### Task 1: Translation Dictionary Expansion

**Files:**
- Modify: `constants/text.ts`

**Step 1: Open `constants/text.ts`**
Add/verify the missing translation strings for `start_trip` and `trip_started`.

```typescript
start_trip: { en: "Start Trip", bn: "যাত্রা শুরু করুন" },
trip_started: { en: "Trip Started", bn: "রাইড শুরু হয়েছে" },
```

Verify `driver_arrived_wait` and other keys are correctly placed.

**Step 2: Commit Task 1**
```bash
git add constants/text.ts
git commit -m "feat: add start_trip and trip_started translations for 3-step driver lifecycle"
```

---

### Task 2: Backend Gating in Trip Completion

**Files:**
- Modify: `app/api/driver/complete/route.ts`

**Step 1: Update status check in route**
Find the status check around line 29:
```typescript
if (booking.status !== "PICKED_UP" && booking.status !== "ARRIVED") {
  return NextResponse.json({ error: "Booking must be in progress (PICKED_UP/ARRIVED) to complete" }, { status: 400 });
}
```

Change it to require **exactly** `"PICKED_UP"`:
```typescript
if (booking.status !== "PICKED_UP") {
  return NextResponse.json({ error: "Booking must be in progress (PICKED_UP) to complete" }, { status: 400 });
}
```

**Step 2: Verify `tx.driver.updateMany`**
Verify that the `totalIncome` increment matches the booking fare:
```typescript
data: { 
  isOnline: true,
  totalRides: { increment: 1 },
  totalIncome: { increment: booking.fare }
}
```
This is correct.

**Step 3: Commit Task 2**
```bash
git add app/api/driver/complete/route.ts
git commit -m "refactor: restrict trip completion API guard to PICKED_UP status"
```

---

### Task 3: Driver Dashboard Start Trip Callback

**Files:**
- Modify: `app/driver/dashboard/page.tsx`

**Step 1: Open `app/driver/dashboard/page.tsx`**
Add the `handleStart` callback using `useCallback` near the other handlers (like `handleArrived` and `finishTrip`):

```typescript
const handleStart = useCallback(async (id: string) => {
  try {
    const res = await apiFetch("/api/driver/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: id })
    });
    if (res.ok) {
      queryClient.invalidateQueries({ queryKey: ["driverSync"] });
      toast.success(t("trip_started") as string);
    } else {
      toast.error(t("error") as string);
    }
  } catch (e) {
    console.error(e);
    toast.error(t("error") as string);
  }
}, [queryClient, t]);
```

**Step 2: Commit Task 3**
```bash
git add app/driver/dashboard/page.tsx
git commit -m "feat: add handleStart callback to driver dashboard page"
```

---

### Task 4: Driver Dashboard ACCEPTED & ARRIVED Card UI

**Files:**
- Modify: `app/driver/dashboard/page.tsx`

**Step 1: Update ACCEPTED Card**
Ensure that the ACCEPTED card has only one primary action button: `"আমি পৌঁছেছি" (I Arrived)` that triggers `handleArrived(currentBooking.id)`.

**Step 2: Update ARRIVED Card**
Update the ARRIVED card to show `"যাত্রা শুরু করুন" (Start Trip)` as the primary button.

Replace the button block in `{currentBooking && currentBooking.status === "ARRIVED" && (...)` with:
```tsx
<AppButton
  onClick={() => handleStart(currentBooking.id)}
  className="w-full h-16 text-lg font-black rounded-2xl shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-white"
  leftIcon={<CheckCircle2 size={24} />}
>
  {t("start_trip")}
</AppButton>
```

**Step 3: Commit Task 4**
```bash
git add app/driver/dashboard/page.tsx
git commit -m "feat: configure ACCEPTED and ARRIVED cards with correct primary buttons"
```

---

### Task 5: Driver Dashboard PICKED_UP Card UI

**Files:**
- Modify: `app/driver/dashboard/page.tsx`

**Step 1: Render PICKED_UP Card**
Add a conditional block to render the ongoing card when `currentBooking.status === "PICKED_UP"`. 

The `PICKED_UP` card represents the "Trip In Progress" state. It should:
1. Show Google Map Preview set to the drop/destination coordinates.
2. Show a navigation button pointing to Google Maps for driving directions to the destination address.
3. Show the "Call User" button.
4. Show the "Complete Trip" button as the primary action.

```tsx
{currentBooking && currentBooking.status === "PICKED_UP" && (
  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
    <div className="flex items-center justify-between px-2">
      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        {t("ongoing")}
      </h3>
      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-black text-[10px] px-3">IN PROGRESS</Badge>
    </div>

    <Card className="border-none shadow-2xl shadow-emerald-500/10 rounded-[2rem] bg-white overflow-hidden">
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
              onClick={finishTrip}
              className="w-full h-16 text-lg font-black rounded-2xl shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-white"
              leftIcon={<CheckCircle2 size={24} />}
            >
              {t("complete_ride")}
            </AppButton>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
)}
```

**Step 2: Commit Task 5**
```bash
git add app/driver/dashboard/page.tsx
git commit -m "feat: render full PICKED_UP trip in progress card on driver dashboard"
```

---

### Task 6: Passenger Page Cancellation Gating

**Files:**
- Modify: `app/user/booking/[id]/page.tsx`

**Step 1: Prevent cancellation when status is `PICKED_UP` (`TRIP_IN_PROGRESS`)**
Find the `showCancelAction` and `canCancelAfterAccept` calculation logic in `app/user/booking/[id]/page.tsx`:
Ensure that once status is `PICKED_UP`, `showCancelAction` evaluates to `false` and the cancel button is hidden.

**Step 2: Commit Task 6**
```bash
git add app/user/booking/[id]/page.tsx
git commit -m "refactor: disable and hide passenger cancellation action once ride starts (PICKED_UP)"
```

---

### Task 7: Full Verification

**Step 1: Compile Check**
Run: `npx tsc --noEmit`
Expected: Zero compilation errors.

**Step 2: Build Check**
Run: `npm run build`
Expected: Successful build production package.

---

## Verification Checklist
- [ ] `npx tsc --noEmit` returns zero type errors.
- [ ] `/api/driver/complete` prevents completions if status is not exactly `PICKED_UP`.
- [ ] Driver dashboard shows "যাত্রা শুরু করুন" (Start Trip) when booking is in `ARRIVED` status.
- [ ] Driver clicking "Start Trip" transitions booking to `PICKED_UP` and renders the active routing/destination card.
- [ ] Driver dashboard shows "ট্রিপ শেষ করুন" (Complete Trip) only when booking is in `PICKED_UP` status.
- [ ] Passenger UI disables the cancellation action as soon as the status transitions to `PICKED_UP` / "Trip in Progress".
