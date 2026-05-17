# Design Document: Incoming Booking Request Modal UI/UX Upgrades

**Date:** 2026-05-18  
**Status:** Approved  
**Scope:** `app/driver/dashboard/page.tsx`

---

## 1. Goal Description

Improve the UI/UX and spacing of the **Incoming Booking Request Modal** shown to drivers. The current modal has vertical spacing overhead, clutters the interface with raw coordinate strings, and places navigation controls in a disjointed way, causing potential screen overflows on smaller mobile screens.

---

## 2. Key Improvements

### A. Backdrop & Card Frame
- Apply a darker backdrop blur overlay (`backdrop-blur-md bg-slate-900/75`).
- Container structured with double border highlights and premium rounded corners (`rounded-t-[2.5rem] sm:rounded-[2.5rem]`).
- Smooth entry animations to capture immediate focus.

### B. Sleek Gradient Header & Active Timer
- Dark-gradient backdrop (`bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900`).
- Animated countdown timer badge with high-contrast indicator colored by urgency (active vs warning).

### C. Fare & Distance Horizontal Deck
- Replace vertical list sections with a compact **horizontal split deck** to visually balance earnings and trip distance.
- Large bold numbers with small, descriptive billing breakdowns (Fare + Fee).

### D. Overlay Maps Navigation Pill
- Embed the *"Navigate in Google Maps"* button directly inside the GoogleMapPreview container as a floating bottom-right glassmorphic pill overlay.
- Reclaims **40px** of vertical screen height.

### E. Silent Timeline (No Coordinates)
- Remove all raw latitude and longitude digits.
- Upgrade the timeline connector with dashed borders and highly styled status pins.

---

## 3. Spacing & Spacing Token Audit

All margins/paddings updated to utilize verified design system tokens:
- Content padding: `p-5` instead of `p-6`
- Outer card padding: `p-4` to `p-5`
- List margins: `gap-3.5` instead of `mb-8` or `mb-6`

---

## 4. Verification Plan

- Run `yarn lint` to ensure ESLint is perfectly clean.
- Run `npx tsc --noEmit --skipLibCheck` to guarantee complete type-safety.
