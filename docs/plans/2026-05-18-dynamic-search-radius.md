# Dynamic Search Radius Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Make the driver search radius dynamic in the dispatch sync loop by reading the `DRIVER_SEARCH_RADIUS_KM` setting from the database and allowing administrators to configure it dynamically in the admin panel settings tab.

**Architecture:** 
1. Move bounding box delta calculation to a pure utility function `getBoundingBox` in `lib/radius.ts` for clean testability.
2. Query `DRIVER_SEARCH_RADIUS_KM` in `app/api/sync/route.ts` using Prisma, and pass it dynamically into both the Bounding Box pre-filter and PostGIS `ST_DWithin` spatial query.
3. Update database seeding in `prisma/seed.ts` to insert/ensure the new setting with a default value of `3`.
4. Add the setting control card in `app/admin/components/tabs/SettingsTab.tsx` with high-quality UX, validation boundaries, and translation mappings.

**Tech Stack:** Next.js (App Router), Prisma, PostgreSQL with PostGIS, Tailwind CSS / Vanilla CSS, React, Jest.

---

### Task 1: Add Translation Keys for Settings
**Files:**
- Modify: `constants/text.ts`

**Step 1: Add new key translation mappings**
Add the translation mappings for search radius title and description inside `constants/text.ts`.

```typescript
  driver_search_radius_title: {
    en: "Driver Search Radius (km)",
    bn: "ড্রাইভার সার্চের রেডিয়াস (কিমি)"
  },
  driver_search_radius_desc: {
    en: "Configure the search radius in kilometers for matching drivers with passenger ride requests.",
    bn: "যাত্রীদের রাইড রিকোয়েস্ট ড্রাইভারদের কাছে পাঠানোর জন্য সার্চের সর্বোচ্চ দূরত্ব (কিলোমিটারে) নির্ধারণ করুন।"
  },
```

**Step 2: Verify translations file builds**
Run `yarn build` or lint compilation check.

---

### Task 2: Implement Utility `lib/radius.ts` and Test
**Files:**
- Create: `lib/radius.ts`
- Create: `tests/dynamic-search-radius.test.ts`

**Step 1: Write the failing test**
Create `tests/dynamic-search-radius.test.ts` expecting `getBoundingBox` to be defined and calculate correctly.

```typescript
import { getBoundingBox } from "../lib/radius";

describe("Dynamic Search Radius calculations", () => {
  it("should calculate correct bounding box with the default 3km radius", () => {
    const coords = getBoundingBox(23.9, 91.2, 3);
    expect(coords.minLat).toBeCloseTo(23.873, 5);
    expect(coords.maxLat).toBeCloseTo(23.927, 5);
    expect(coords.minLng).toBeCloseTo(91.173, 5);
    expect(coords.maxLng).toBeCloseTo(91.227, 5);
  });

  it("should calculate correct bounding box with custom 5km radius", () => {
    const coords = getBoundingBox(23.9, 91.2, 5);
    expect(coords.minLat).toBeCloseTo(23.855, 5);
    expect(coords.maxLat).toBeCloseTo(23.945, 5);
    expect(coords.minLng).toBeCloseTo(91.155, 5);
    expect(coords.maxLng).toBeCloseTo(91.245, 5);
  });
});
```

**Step 2: Run test to verify it fails**
Run: `yarn test tests/dynamic-search-radius.test.ts`
Expected: Fail since the utility module does not exist.

**Step 3: Write minimal implementation**
Create `lib/radius.ts` to implement `getBoundingBox`:
```typescript
export function getBoundingBox(lat: number, lng: number, radiusKm: number) {
  const latDelta = radiusKm * 0.009;
  const lngDelta = radiusKm * 0.009;
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
}
```

**Step 4: Run test to verify it passes**
Run: `yarn test tests/dynamic-search-radius.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add lib/radius.ts tests/dynamic-search-radius.test.ts
git commit -m "feat: add dynamic search radius utility and tests"
```

---

### Task 3: Integrate Dynamic Search Radius in Sync API
**Files:**
- Modify: `app/api/sync/route.ts`

**Step 1: Retrieve and apply setting value in sync route**
- Retrieve the `DRIVER_SEARCH_RADIUS_KM` setting from `prisma.systemSetting`.
- Parse its value and fall back to `3` km if not found.
- Replace manual bounding box calculation with `getBoundingBox` helper.
- Update PostGIS `ST_DWithin` query to use dynamic search radius converted to meters (`radiusKm * 1000`).

**Step 2: Run compile-time check**
Run: `npx tsc --noEmit`
Expected: Successful compile.

---

### Task 4: Add Seeding Configuration
**Files:**
- Modify: `prisma/seed.ts`

**Step 1: Add system setting seed**
Inject the dynamic search radius key-value seed with a default of `"3"` inside the database transaction:
```typescript
    await tx.systemSetting.upsert({
      where: { key: 'DRIVER_SEARCH_RADIUS_KM' },
      update: {},
      create: {
        key: 'DRIVER_SEARCH_RADIUS_KM',
        value: '3',
      },
    });
```

**Step 2: Run Prisma seed command**
Run: `npx prisma db seed`
Expected: DB seeded successfully with new setting key-value pair.

---

### Task 5: Add Control Card to SettingsTab Component
**Files:**
- Modify: `app/admin/components/tabs/SettingsTab.tsx`

**Step 1: Implement search radius input field**
Add a card structure corresponding to the dynamic search radius below the `PLATFORM_FEE_PERCENTAGE` section.

```tsx
          {/* Driver Search Radius */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
            <div>
              <h4 className="font-semibold text-slate-900">
                {t("driver_search_radius_title" as TextKey) || "Driver Search Radius (km)"}
              </h4>
              <p className="text-sm text-slate-500 mt-1">
                {t("driver_search_radius_desc" as TextKey) || "Configure the search radius in kilometers for matching drivers with passenger ride requests."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="0.5"
                  value={getSettingValue("DRIVER_SEARCH_RADIUS_KM", "3")}
                  onChange={(e) =>
                    handleValueChange(
                      "DRIVER_SEARCH_RADIUS_KM",
                      e.target.value
                    )
                  }
                  className="w-32 pl-4 pr-8 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-900"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                  {t("km_unit" as TextKey) || "km"}
                </span>
              </div>
              <AppButton
                onClick={() => handleSave("DRIVER_SEARCH_RADIUS_KM")}
                loading={isSaving["DRIVER_SEARCH_RADIUS_KM"]}
                leftIcon={<Save className="w-4 h-4" />}
                className="whitespace-nowrap"
              >
                {t("save_changes" as TextKey) || "Save"}
              </AppButton>
            </div>
          </div>
```

**Step 2: Run linter verification**
Run: `yarn lint`
Expected: Clean lint compilation.
