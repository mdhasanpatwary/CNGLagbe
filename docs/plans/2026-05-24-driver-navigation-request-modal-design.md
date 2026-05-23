# Design: Driver Navigation from Pickup to Destination in Incoming Request Modal

This design document outlines the updates to the incoming ride request notification modal on the driver dashboard, enabling drivers to launch Google Maps showing the exact passenger route from the pickup location to the destination prior to accepting a ride.

## Goal
Update the Google Maps directions URL constructed by the "Navigate" button (floating pill overlay on the map preview) inside the driver dashboard's incoming ride request modal to show routing directly from the ride's **pickup coordinates** to its **destination coordinates**.

## Background
Currently, the "Navigate" button on the incoming request modal launches Google Maps with:
`https://www.google.com/maps/dir/?api=1&destination=${req.pickupLat},${req.pickupLng}&travelmode=driving`
This only routes from the driver's current position to the pickup location. To help the driver make an informed decision on whether to accept the ride, the button should display the entire trip route requested by the passenger (from pickup to drop-off).

## User Review Required
No major architectural changes or breaking changes are introduced. This is a pure URL parameter update.

## Proposed Changes

### Component: Driver Dashboard

#### [MODIFY] [page.tsx](file:///Users/patwary/Projects/CNGLagbe/app/driver/dashboard/page.tsx)
Update the navigation link within the incoming request card/modal render method:
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

## Verification Plan
*   **TypeScript Validation:** Run `npx tsc --noEmit` to verify type safety.
