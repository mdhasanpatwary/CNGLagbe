# CNG Lagbe – MVP PWA TODO

> **Strategy:** Ship fast → validate demand → then optimize. Don't overbuild early.
>
> **Stack assumption:** Next.js monolith · Supabase/PostgreSQL+PostGIS · Vercel or Railway

---

## 🔥 MVP Scope Rules
- **Core Focus:** Request booking → Accept booking → **Driver Arrives (Booking Completed).**
- **Strictly Fixed Fare ONLY:** No dynamic pricing, no wait-time calculations.
- **Simplest Functional Path:** Avoid complex state reconciliation, queues, or offline syncs.
- **Scope Locked:** "Working system first, perfect system later."
- **Booking Lifecycle:** We don't take responsibility after the driver arrives. It's a one-time true booking.
- **Cost Optimization (STRICT):** 
    - **Live Tracking**: Load Google Maps once per session; move markers locally via Supabase Realtime/Polling. 0 repeated Google API calls during tracking.
    - **Static vs Dynamic**: Use **Maps Static API** for non-interactive views (Confirm Location, History, Mini-maps) to save $5/1k loads.
    - **Geocoding Cache**: Store address results in a local `GeoCache` table to avoid $5/1k calls for same coords.
    - **Payload Throttling**: Drive location updates only if moved >5m or >10s elapsed.

---

## 🏗️ Architecture

- [ ] Subdomain-based PWA split — `cnglagbe.com` (User) · `driver.cnglagbe.com` (Driver)
- [ ] Single Next.js monolith — shared API routes for both apps
- [ ] Middleware-based subdomain routing (detect `host` header → serve correct PWA shell)
- [ ] Role-based auth redirect — driver visiting user subdomain (or vice versa) redirects correctly
- [ ] Shared cookie domain set to `.cnglagbe.com` for cross-subdomain session sharing
- [ ] Separate `manifest.json` per subdomain (different PWA name, icon, theme color)
- [ ] App Role Detection — use `window.location.hostname` continuously on the client.

---

## 📱 User App (PWA)

### Auth
- [ ] Simple phone number login (Skip OTP verification for MVP, but keep input)
- [ ] [POST-MVP] OTP via SMS & Verification
- [ ] Issue JWT in httpOnly cookie upon login
- [ ] Auto-login on return visit (cookie persists)
- [ ] Logout — clear cookie + invalidate server-side session

### Booking Flow
- [ ] GPS auto-detect pickup location with manual override
- [ ] Destination selection **ONLY via map marker drop** (no Google Places Autocomplete for MVP)
- [ ] Map pin drag-to-adjust for both pickup and destination
- [ ] Confirm location step before requesting — show map preview
- [ ] **Fixed Fare** estimate shown before confirm (server-calculated, locked in at request time)
- [ ] "Request CNG" button — disabled immediately after first tap
- [ ] Active-booking lock — user cannot request a second booking while one is active

### During Booking / Completion
- [ ] Waiting screen — animated state, searching for driver
- [ ] Driver assigned screen — driver name, vehicle number, photo, live location on map (load map once + move marker(marker will be cng icon) only (no repeated API calls))
- [ ] "Driver has arrived" status push → **Marks booking as COMPLETED**
- [ ] Booking ended screen — show final fixed fare to pay in cash

### Post-Booking
- [ ] Booking history list (date, pickup, destination, fare, driver)
- [ ] Booking detail view
- [ ] Report issue button (wrong fare, no-show, misconduct) — linked to booking ID

---

## 🚗 Driver App (PWA)

### Auth
- [ ] Simple phone number login — role=driver in JWT (Skip OTP verification for MVP)
- [ ] First-time profile setup: name, NID number, vehicle type, plate number, photo upload
- [ ] Admin approval gate — driver cannot go online until approved

### Status & Availability
- [ ] Online / Offline toggle — large, prominent, one-tap
- [ ] Show today's bookings count + earnings on home screen (motivation to stay online)

### Location Sending
- [ ] Basic geolocation update (`setInterval` 5-10s) to securely push updates to the server.
- [ ] Warn driver if location permission is denied.

### Booking Request Handling
- [ ] Incoming request = fullscreen modal takeover, cannot be accidentally dismissed
- [ ] Alert sound via Web Audio API
- [ ] 20-second accept timer — auto-reject if no action
- [ ] Show user pickup point on map before accepting
- [ ] Accept → deep link to Google Maps for navigation to pickup
- [ ] **"I've arrived" button → Completes the booking, ends system tracking, shows fare to collect.**

### Post-Booking
- [ ] Booking summary card — distance, fixed fare earned
- [ ] Earnings accumulate in session total visible on home screen

---

## ⚙️ Backend & System Logic

### Auth & Identity
- [ ] JWT with `role` claim (`user` | `driver`) — verified middleware on every protected route
- [ ] Driver `approved` status checked server-side on every driver API call

### Booking State Machine
Enforce all transitions server-side. Never trust client-reported state.
`REQUESTED → DRIVER_ASSIGNED → COMPLETED (On driver arrival)`
`         ↘ TIMED_OUT (no driver) / CANCELLED`

- [ ] Atomic booking assignment via DB transaction + row-level lock (prevents double-assignment)
- [ ] One active booking per user max — server-side check
- [ ] One active booking per driver max — server-side check
- [ ] Booking request auto-expires to TIMED_OUT after 5 minutes with no assignment

### Fare System (Strictly Fixed)
- [ ] Fare calculated server-side only — client never sends a fare, only receives it
- [ ] Formula: `base_fare + (distance_km × per_km_rate)` ONLY. No dynamic pricing.
- [ ] Fixed fare snapshot stored at booking creation. This is the **final immutable fare**.

### Cancellation Policy
- [ ] Cancel reason required
- [ ] User limit: 3 cancels/hour → 30-min booking cooldown
- [ ] Driver limit: 3 cancels/hour → forced offline + warning
- [ ] All cancels stored with reason + timestamp

### Search & Matching (Basic Logic)
- [ ] Simple Geospatial driver search using PostGIS — find online, available drivers within close radius.
- [ ] Sort candidates by distance (nearest first).
- [ ] Send request to nearest driver first.
- [ ] Do not re-send to a driver who already rejected this booking.

### Network Resilience (Basics Only)
- [ ] Idempotency key on mutating API calls (UUID sent by client, server deduplicates)
- [ ] Basic Client auto-retry on 500 errors.

### Booking Audit Log
- [ ] Store per booking: user_id, driver_id, start timestamps, start/end coords, polyline, fixed fare.
- [ ] Admin can look up any booking by ID.

---

## 🔔 Notifications & Real-time

- [ ] Polling every 5 sec for driver/user state sync (simple & reliable).
- [ ] Basic Server-Sent Events (SSE) if simple to implement for user-side updates, otherwise pure polling.
- [ ] Web Push Notifications for "New booking request nearby" as a backup (optional for early MVP).

---

## 🔐 Auth & Session
- [ ] Cookies: `httpOnly`, `Secure`, `SameSite=None`
- [ ] Cookie domain: `.cnglagbe.com`
- [ ] Login rate limit

---

## 💰 Payments (MVP)
- [ ] **Cash only.** Paid to driver upon arrival. No MFS/bKash integration in MVP.
- [ ] Both user and driver see the same fare on booking completion screen

---

## 🧑‍💼 Admin Panel
- [ ] Protected admin route (`/admin`)
- [ ] Live map — all active bookings + online drivers
- [ ] Driver management: approve / suspend
- [ ] User management: view history
- [ ] Booking log: view full booking log

---

## 🧪 Pre-launch Test Checklist
- [ ] Happy path end-to-end: request → accept → arrive (completed) → fixed fare shown
- [ ] User cancels before driver assigned
- [ ] Duplicate booking request attempt — second blocked
- [ ] Cross-subdomain session works
- [ ] Booking works fully via PWA (User and Driver) externally


