# Design Document: Mandatory Road Distance for Fare Calculation

**Date:** 2026-05-27
**Status:** Approved

## Overview
Currently, the passenger fare calculation backend APIs `/api/fare/calculate` and `/api/booking/create` contain a fallback mechanism. If the actual driving road distance (`distance` / `manualDistance`) is not provided by the client, the backend falls back to using the Haversine formula (`calculateDistance`) to estimate distance based on straight-line coordinates. 

Because the Haversine formula calculates straight-line distance, it severely underestimates the actual driving distance on local curved roads, resulting in incorrect, unprofitable fares. 

To solve this, we are removing the Haversine formula from all fare calculation logic and making actual road distance a **strict mandatory validation requirement** at the API level.

---

## Proposed Changes

### 1. `app/api/fare/calculate/route.ts`
* Remove the fallback call to `calculateDistance`.
* Validate that `distance` is present in the request body, is a valid number, and is greater than `0`.
* If validation fails, return `400 Bad Request` with:
  ```json
  {
    "error": "Missing road distance",
    "message": "Actual driving road distance is required for fare calculation."
  }
  ```

### 2. `app/api/booking/create/route.ts`
* Remove the fallback call to `calculateDistance`.
* Validate that `distance` is present in the request body, is a valid number, and is greater than `0`.
* If validation fails, return `400 Bad Request` with:
  ```json
  {
    "error": "Missing road distance",
    "message": "Actual driving road distance is required for fare calculation."
  }
  ```

### 3. `lib/fare.ts`
* Add strict warning comments to `calculateDistance` explaining that it **MUST NOT** be used for fare calculation, only for driver proximity calculations.

---

## Verification Plan

### Automated Verification
* Verify build compilation using `npx tsc --noEmit`.
* Verify that posting to `/api/fare/calculate` without `distance` returns `400 Bad Request`.
* Verify that posting to `/api/booking/create` without `distance` returns `400 Bad Request`.
* Verify that sending a valid `distance` calculates correct fare successfully.
