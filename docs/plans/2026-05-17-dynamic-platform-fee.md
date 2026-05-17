# Dynamic Platform Fee Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Allow administrators to customize the platform fee percentage dynamically via the Admin Settings tab, which is saved in the database under `PLATFORM_FEE_PERCENTAGE` and dynamically read when calculating ride preview fares and booking creations.

**Architecture:** Refactor `calculateFare` in `lib/fare.ts` to be pure and accept an optional percentage parameter, querying settings inside the server-side API routes (`/api/fare/calculate` and `/api/booking/create`) to keep utility helpers synchronous.

**Tech Stack:** Next.js, Prisma, Jest, TailwindCSS, React.

---

### Task 1: Create Unit Test and Meticulously Refactor Utility Layer

**Files:**
- Modify: `lib/fare.ts:28-42`
- Create: `tests/dynamic-platform-fee.test.ts`

**Step 1: Write the failing test**
Create a new file `tests/dynamic-platform-fee.test.ts` to verify both standard and custom platform fee calculations:
```typescript
import { calculateFare } from "../lib/fare";

describe("Dynamic Platform Fee Calculations", () => {
  it("should calculate correct platform fee with the default 5% percentage", () => {
    // 10km distance = 100 base + 150 distance = 250 BDT fare
    // 5% of 250 is 12.5, rounded to 13 BDT
    const result = calculateFare(10);
    expect(result.fare).toBe(250);
    expect(result.platformFee).toBe(13);
    expect(result.totalFare).toBe(263);
  });

  it("should calculate correct platform fee with custom 20% platform fee percentage", () => {
    // 10km distance = 250 BDT base fare
    // 20% of 250 is 50 BDT platform fee
    // @ts-expect-error - testing the new parameter before it is officially added to signature
    const result = calculateFare(10, 20);
    expect(result.fare).toBe(250);
    expect(result.platformFee).toBe(50);
    expect(result.totalFare).toBe(300);
  });

  it("should respect the minimum 10 BDT floor for platform fees", () => {
    // 0km distance = 100 BDT base fare
    // 5% of 100 is 5 BDT, which is lower than 10 BDT floor, should return 10 BDT
    const result = calculateFare(0, 5);
    expect(result.fare).toBe(100);
    expect(result.platformFee).toBe(10);
    expect(result.totalFare).toBe(110);
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx jest tests/dynamic-platform-fee.test.ts`
Expected: FAIL due to custom percentage parameter failing to calculate properly (it will still use the hardcoded 5%).

**Step 3: Write minimal implementation**
Modify `lib/fare.ts` to accept the optional parameter:
```typescript
export function calculateFare(distanceKm: number, platformFeePercentage: number = 5) {
  const BASE_FARE = 100;
  const PER_KM_RATE = 15;

  const fare = Math.round(BASE_FARE + distanceKm * PER_KM_RATE);
  const platformFee = Math.max(10, Math.round(fare * (platformFeePercentage / 100)));
  const totalFare = fare + platformFee;

  return {
    fare,         // This is the base booking fare
    platformFee,  // Added on top
    totalFare     // Final amount passenger pays
  };
}
```

**Step 4: Run test to verify it passes**
Run: `npx jest tests/dynamic-platform-fee.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add tests/dynamic-platform-fee.test.ts lib/fare.ts
git commit -m "feat: add dynamic platform fee percentage parameter and unit tests"
```

---

### Task 2: Dynamically Read Platform Fee Percentage in API Routes

**Files:**
- Modify: `app/api/fare/calculate/route.ts`
- Modify: `app/api/booking/create/route.ts`

**Step 1: Write the dynamic database queries**
Fetch setting `PLATFORM_FEE_PERCENTAGE` using Prisma inside the GET/POST handlers.
For `app/api/fare/calculate/route.ts`:
```typescript
    // Fetch dynamic platform fee setting
    const feeSetting = await prisma.systemSetting.findUnique({
      where: { key: "PLATFORM_FEE_PERCENTAGE" },
    });
    const platformFeePercentage = feeSetting ? Number(feeSetting.value) : 5;

    const fareBreakdown = calculateFare(distance, platformFeePercentage);
```
Ensure `prisma` is imported from `@/lib/prisma`.

For `app/api/booking/create/route.ts`:
```typescript
      // Fetch dynamic platform fee setting
      const feeSetting = await prisma.systemSetting.findUnique({
        where: { key: "PLATFORM_FEE_PERCENTAGE" },
      });
      const platformFeePercentage = feeSetting ? Number(feeSetting.value) : 5;

      const fare = calculateFare(distance, platformFeePercentage);
```

**Step 2: Run verification checks**
Run: `npx tsc --noEmit`
Expected: SUCCESS

**Step 3: Commit**
```bash
git add app/api/fare/calculate/route.ts app/api/booking/create/route.ts
git commit -m "feat: read dynamic platform fee settings in API routes"
```

---

### Task 3: Seed Default Platform Fee Setting

**Files:**
- Modify: `prisma/seed.ts`

**Step 1: Add dynamic setting seed block**
Upsert `PLATFORM_FEE_PERCENTAGE` to `prisma/seed.ts`:
```typescript
  // Seed System Settings
  await prisma.systemSetting.upsert({
    where: { key: "PLATFORM_FEE_PERCENTAGE" },
    update: {},
    create: {
      key: "PLATFORM_FEE_PERCENTAGE",
      value: "5",
    },
  });
```

**Step 2: Run the database seed script**
Run: `npx prisma db seed`
Expected: SUCCESS with seeded DB entry.

**Step 3: Commit**
```bash
git add prisma/seed.ts
git commit -m "db: seed default platform fee percentage setting"
```

---

### Task 4: Add Dynamic Platform Fee Settings Row to Admin Portal UI

**Files:**
- Modify: `constants/text.ts`
- Modify: `app/admin/components/tabs/SettingsTab.tsx`

**Step 1: Map dynamic translations inside `constants/text.ts`**
Add settings key translations:
```typescript
  platform_fee_percentage: { en: "Platform Fee Percentage", bn: "প্ল্যাটফর্ম ফি শতকরা হার" },
  platform_fee_percentage_desc: {
    en: "The dynamic percentage taken from the total booking amount for dynamic booking charges.",
    bn: "বুকিংয়ের মোট পরিমাণ থেকে চার্জ করা প্ল্যাটফর্ম ফির ডাইনামিক শতকরা হার।"
  },
```

**Step 2: Add dynamic input inside `app/admin/components/tabs/SettingsTab.tsx`**
Render a new control card inside the settings tab below the balance setting card:
```tsx
          {/* Dynamic Platform Fee Percentage */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
            <div>
              <h4 className="font-semibold text-slate-900">
                {t("platform_fee_percentage" as TextKey) || "Platform Fee Percentage"}
              </h4>
              <p className="text-sm text-slate-500 mt-1">
                {t("platform_fee_percentage_desc" as TextKey) ||
                  "The dynamic percentage taken from the total booking amount for dynamic booking charges."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={getSettingValue("PLATFORM_FEE_PERCENTAGE", "5")}
                  onChange={(e) =>
                    handleValueChange(
                      "PLATFORM_FEE_PERCENTAGE",
                      e.target.value
                    )
                  }
                  className="w-32 pr-8 pl-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-900"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                  %
                </span>
              </div>
              <AppButton
                onClick={() => handleSave("PLATFORM_FEE_PERCENTAGE")}
                loading={isSaving["PLATFORM_FEE_PERCENTAGE"]}
                leftIcon={<Save className="w-4 h-4" />}
                className="whitespace-nowrap"
              >
                {t("save" as TextKey) || "Save"}
              </AppButton>
            </div>
          </div>
```

**Step 3: Run comprehensive verification**
Run: `npx tsc --noEmit && yarn build`
Expected: Clean build with zero TypeScript or lint errors.

**Step 4: Commit**
```bash
git add constants/text.ts app/admin/components/tabs/SettingsTab.tsx
git commit -m "feat: render dynamic platform fee percentage row in Admin Settings UI"
```
