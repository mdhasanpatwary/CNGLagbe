# Driver Navigation Request Modal Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Allow drivers to open Google Maps navigation showing the path from pickup to destination by clicking the "Navigate" button in the incoming ride request modal.

**Architecture:** Modify the floating `<a>` anchor link inside the `GoogleMapPreview` container in `app/driver/dashboard/page.tsx` to set both `origin` (pickup point) and `destination` (drop-off point) parameters in the Google Maps directions URL.

**Tech Stack:** React, Next.js, Google Maps directions URL format.

---

### Task 1: Update navigation link URL in Incoming Request Modal

**Files:**
- Modify: `app/driver/dashboard/page.tsx:1259-1266`

**Step 1: Write the changes**

```tsx
                    {/* Floating Google Maps Overlay Pill */}
                    <a 
                      target="_blank" 
                      rel="noopener noreferrer"
                      href={`https://www.google.com/maps/dir/?api=1&origin=${req.pickupLat},${req.pickupLng}&destination=${req.destLat},${req.destLng}&travelmode=driving`}
                      className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 text-blue-600 text-[10px] font-black uppercase bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-full hover:bg-white hover:scale-105 transition-all shadow-lg border border-slate-200/80"
                    >
                      <Navigation size={12} /> {t("nav_google_maps")}
                    </a>
```

**Step 2: Run verification to check TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: Success with no errors.

**Step 3: Document taste preferences**

Add the new taste preference in `taste.md` indicating that the "Navigate" button in the incoming request modal is explicitly configured to show the path from pickup to destination for driver preview before acceptance.
