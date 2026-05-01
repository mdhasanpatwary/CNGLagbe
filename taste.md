# CNGLagbe - Taste & Regression Log

This document tracks specific issues, edge cases, and UI/UX improvements that have been fixed or established during development. 
The goal is to ensure these specific "tastes" (design preferences, UX choices, and critical fixes) are documented so they do not break or revert in future updates. 

*Whenever a new edge case is fixed or a specific UX flow is perfected, add it here.*

## 🗺️ Map & Location Features
- **POI Clicks on Map:** When a user clicks on a Point of Interest (POI) (like a school or mosque), the app must intercept the click (`e.stop()`) to prevent the default Google Maps info window. It should then fetch the actual place name via the Places API and display it in the search input, rather than just showing coordinates.
- **Reverse Geocoding (No Plus Codes):** The app must filter out `plus_code` types from Google Geocoding API results. We always prioritize human-readable street or area addresses over Plus Codes (e.g., avoiding strings like `4F6Q+MM8, Bangladesh`).

## 🚖 Ride Request & Booking Flow
- **Request Again Button:** If a ride search times out or fails to find a driver, a "Request Again" button must appear, allowing the user to seamlessly retry the request without re-entering their pickup and destination.
- **Address-First Experience:** The booking flow emphasizes human-readable addresses for pickup and drop-off, rather than raw coordinates, across the user map, booking details, and driver dashboard.

## 🧑‍✈️ Driver Dashboard
- **Fullscreen Map Overlap:** In the driver panel, when the map is expanded to fullscreen from a ride request modal, it must sit correctly above the page header (ensuring proper z-index and layout management).
- **Geolocation Error Handling:** Geolocation timeouts and transient errors are handled gracefully. Unnecessary or spammy error notifications are suppressed to keep the driver's UI clean.

## 📱 UI/UX & Design Standards
- **Premium Aesthetics:** The app uses modern web design principles (vibrant colors, smooth micro-animations, proper spacing). It should never look like a basic "minimum viable product".
- **Localization (No Hardcoded Strings):** All UI text must strictly use the central `TEXT` dictionary (`constants/text.ts`) to support English and Bengali seamlessly.
- **Clear Action Text:** All buttons and actionable elements must have explicit, action-oriented text.
- **Icon Labels:** Icons must always be accompanied by text labels to assist low-literacy users.

## ⚙️ Performance & Database
- **Direct Database Connections:** Prisma is configured with a dedicated direct URL and proper connection pooling to eliminate database performance overhead.
- **Parallel Queries:** API routes (like `/api/sync`) execute independent queries in parallel to optimize response times.
