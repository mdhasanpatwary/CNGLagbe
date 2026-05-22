# Design: Dynamic CNG Per KM Rate

This document outlines the design for making the per kilometer rate for CNG bookings dynamic (configurable from the Admin Settings) and updating its default value to 20 BDT/km (previously 15 BDT/km).

## User Review Required

> [!IMPORTANT]
> The default per kilometer rate for fare calculations will change from **15 BDT/km** to **20 BDT/km**. The database seed file will also be updated to insert a default setting of `CNG_PER_KM_RATE` = `'20'`.

## Proposed Changes

### Core Logic

#### [MODIFY] [fare.ts](file:///Users/patwary/Projects/CNGLagbe/lib/fare.ts)
* Update `calculateFare` to accept an optional `perKmRate` argument defaulting to `20`.
* Replace the hardcoded `PER_KM_RATE = 15` constant with the dynamic `perKmRate` argument.

### API Routes

#### [MODIFY] [calculate/route.ts](file:///Users/patwary/Projects/CNGLagbe/app/api/fare/calculate/route.ts)
* Fetch `CNG_PER_KM_RATE` from `prisma.systemSetting`.
* Use `20` as the fallback default value.
* Pass the retrieved `perKmRate` to `calculateFare`.

#### [MODIFY] [create/route.ts](file:///Users/patwary/Projects/CNGLagbe/app/api/booking/create/route.ts)
* Fetch `CNG_PER_KM_RATE` from `prisma.systemSetting`.
* Use `20` as the fallback default value.
* Pass the retrieved `perKmRate` to `calculateFare`.

### Seeding

#### [MODIFY] [seed.ts](file:///Users/patwary/Projects/CNGLagbe/prisma/seed.ts)
* Add `CNG_PER_KM_RATE` to the seeded system settings with a value of `'20'`.

### Translations & Admin Settings UI

#### [MODIFY] [text.ts](file:///Users/patwary/Projects/CNGLagbe/constants/text.ts)
* Add translations for `per_km_rate_title` and `per_km_rate_desc` in English and Bangla.

#### [MODIFY] [SettingsTab.tsx](file:///Users/patwary/Projects/CNGLagbe/app/admin/components/tabs/SettingsTab.tsx)
* Add a card/input row for configuring the Per KM Rate in the Admin settings interface.
* Hook it up to the `CNG_PER_KM_RATE` setting key.

### Tests

#### [MODIFY] [dynamic-platform-fee.test.ts](file:///Users/patwary/Projects/CNGLagbe/tests/dynamic-platform-fee.test.ts)
* Update assertions to reflect the default rate of `20` instead of `15`.

## Verification Plan

### Automated Tests
* Run `yarn test tests/dynamic-platform-fee.test.ts` to ensure that unit calculations work correctly.
* Run a global build/lint check to ensure there are no TypeScript or compilation errors.

### Manual Verification
* Run the database seed to initialize the new setting.
* Verify the Admin Settings Tab contains the new input field, saves successfully, and calculates fares accordingly.
