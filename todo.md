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
    - **Payload Throttling**: Drive location updates only if moved >100m or >30s elapsed.

---

## 🏗️ Architecture

- [x] Subdomain-based PWA split — `cnglagbe.com` (User) · `driver.cnglagbe.com` (Driver)
- [x] Single Next.js monolith — shared API routes for both apps
- [x] Middleware-based subdomain routing (detect `host` header → serve correct PWA shell)
- [x] Role-based auth redirect — driver visiting user subdomain (or vice versa) redirects correctly
- [x] Shared cookie domain set to `.cnglagbe.com` for cross-subdomain session sharing
- [x] Separate `manifest.json` per subdomain (different PWA name, icon, theme color)
- [x] App Role Detection — use `window.location.hostname` continuously on the client.

---

## 📱 User App (PWA)

### Auth
- [x] Simple phone number login (Skip OTP verification for MVP, but keep input)
- [ ] [POST-MVP] OTP via SMS & Verification
- [x] Issue JWT in httpOnly cookie upon login
- [x] Auto-login on return visit (cookie persists)
- [x] Logout — clear cookie + invalidate server-side session

### Booking Flow
- [x] GPS auto-detect pickup location with manual override
- [x] Destination selection via map marker drop & Google Places Autocomplete
- [x] Map pin drag-to-adjust for both pickup and destination
- [x] Confirm location step before requesting — show map preview
- [x] **Fixed Fare** estimate shown before confirm (server-calculated, locked in at request time)
- [x] "Request CNG" button — disabled immediately after first tap
- [x] Active-booking lock — user cannot request a second booking while one is active

### During Booking / Completion
- [x] Waiting screen — animated state, searching for driver
- [x] Driver assigned screen — driver name, vehicle number, photo, live location on map (load map once + move marker(marker will be cng icon) only (no repeated API calls))
- [x] "Driver has arrived(pickup point)" status push → **Marks booking as COMPLETED**
- [x] Booking ended screen — show final fixed fare to pay in cash
- [x] Cancel button and 5-minute timeout on waiting screen — if no driver, status to "no driver found" and allow retry

### Post-Booking
- [x] Booking history list (date, pickup, destination, fare, driver)
- [x] Booking detail view
- [x] Report issue button (wrong fare, no-show, misconduct) — linked to booking ID


---

## 🚗 Driver App (PWA)

### Auth
- [x] Simple phone number login — role=driver in JWT (Skip OTP verification for MVP)
- [x] First-time profile setup: name, NID number, vehicle type, plate number, photo upload
- [x] Admin approval gate — driver cannot go online until approved

### Status & Availability
- [x] Online / Offline toggle — large, prominent, one-tap
- [x] Show today's bookings count + earnings on home screen (motivation to stay online)

### Location Sending
- [x] Basic geolocation update (`setInterval` 5-10s) to securely push updates to the server.
- [x] Warn driver if location permission is denied.

### Booking Request Handling
- [x] Incoming request = fullscreen modal takeover, cannot be accidentally dismissed
- [x] Alert sound via Web Audio API
- [x] 5-minute accept timer — auto-reject if no action
- [x] Show user pickup point on map before accepting
- [x] Accept → deep link to Google Maps for navigation to pickup
- [x] **"I've arrived" button → Completes the booking, ends system tracking, shows fare to collect.**

### Post-Booking
- [x] Booking summary card — distance, fixed fare earned
- [x] Earnings accumulate in session total visible on home screen

---

## ⚙️ Backend & System Logic

### Auth & Identity
- [x] JWT with `role` claim (`user` | `driver`) — verified middleware on every protected route
- [x] Driver `approved` status checked server-side on every driver API call

### Booking State Machine
Enforce all transitions server-side. Never trust client-reported state.
`REQUESTED → DRIVER_ASSIGNED → COMPLETED (On driver arrival)`
`         ↘ TIMED_OUT (no driver within 5 minutes) / CANCELLED`

- [x] Atomic booking assignment via DB transaction + row-level lock (prevents double-assignment)
- [x] One active booking per user max — server-side check
- [x] One active booking per driver max — server-side check
- [x] Booking request auto-expires to TIMED_OUT after 5 minutes with no assignment

### Fare System (Strictly Fixed)
- [x] Fare calculated server-side only — client never sends a fare, only receives it
- [x] Formula: `base_fare + (distance_km × per_km_rate)` ONLY. No dynamic pricing.
- [x] Fixed fare snapshot stored at booking creation. This is the **final immutable fare**.

### Cancellation Policy
- [x] Cancel reason required
- [x] User limit: 3 cancels/hour → 30-min booking cooldown
- [x] Driver limit: 3 cancels/hour → forced offline + warning
- [x] All cancels stored with reason + timestamp

### Search & Matching (Basic Logic)
- [x] Simple Geospatial driver search using PostGIS — find online, available drivers within close radius.
- [x] Sort candidates by distance (nearest first).
- [x] Send request to nearest driver first.
- [x] Do not re-send to a driver who already rejected this booking.

### Network Resilience (Basics Only)
- [x] Idempotency key on mutating API calls (UUID sent by client, server deduplicates)
- [x] Basic Client auto-retry on 500 errors.

### Booking Audit Log
- [x] Store per booking: user_id, driver_id, start timestamps, start/end coords, polyline, fixed fare.
- [x] Admin can look up any booking by ID.

---

## 🔔 Notifications & Real-time

- [x] Polling every 5 sec for driver/user state sync (simple & reliable).
- [x] Basic Server-Sent Events (SSE) if simple to implement for user-side updates, otherwise pure polling.
- [ ] Web Push Notifications for "New booking request nearby" as a backup (optional for early MVP).

---

## 🔐 Auth & Session
- [x] Cookies: `httpOnly`, `Secure`, `SameSite=None`
- [x] Cookie domain: `.cnglagbe.com`
- [x] Login rate limit

---

## 💰 Payments (MVP)
- [x] **Cash only.** Paid to driver upon arrival. No MFS/bKash integration in MVP.
- [x] Both user and driver see the same fare on booking completion screen

---

## 🧑‍💼 Admin Panel
- [x] Protected admin route (`/admin`)
- [x] Admin Monitor — Active bookings + online drivers list (Manual Refresh)
- [x] Driver management: approve / suspend
- [x] User management: view history
- [x] Booking log: view full booking log

---

## 🧪 Pre-launch Test Checklist
- [ ] Happy path end-to-end: request → accept → arrive (completed) → fixed fare shown
- [ ] User cancels before driver assigned
- [ ] Duplicate booking request attempt — second blocked
- [ ] Cross-subdomain session works
- [ ] Booking works fully via PWA (User and Driver) externally

