# CNGLagbe - Taste & Regression Log

This document tracks specific issues, edge cases, and UI/UX improvements that have been fixed or established during development. 
The goal is to ensure these specific "tastes" (design preferences, UX choices, and critical fixes) are documented so they do not break or revert in future updates. 

*Whenever a new edge case is fixed or a specific UX flow is perfected, add it here.*

## 🗺️ Map & Location Features
- **POI Clicks on Map:** When a user clicks on a Point of Interest (POI) (like a school or mosque), the app must intercept the click (`e.stop()`) to prevent the default Google Maps info window. It should then fetch the actual place name via the Places API and display it in the search input, rather than just showing coordinates.
- **Reverse Geocoding (No Plus Codes):** The app must filter out `plus_code` types from Google Geocoding API results. We always prioritize human-readable street or area addresses over Plus Codes (e.g., avoiding strings like `4F6Q+MM8, Bangladesh`).
- **Responsive Map Padding:** When fitting the map to show a route or markers (`fitBounds`), the padding must be responsive. On mobile, add significant bottom padding (e.g., `window.innerHeight * 0.6`) to ensure the content remains visible above the bottom sheet. On desktop, add left padding (e.g., `420px`) to clear the sidebar.
- **Route Polyline Management:** When drawing routes on the map (polylines), the previous polyline MUST be cleared from the map using `setMap(null)` before a new one is drawn. Failure to do this causes multiple route lines to overlap, especially when a user edits their route or restores from a session. The `drawPolyline` helper and the route `useEffect` must always manage the `fallbackPolylineRef` to ensure only one current route is active.
- **Driver-User Call Interface:** The "Call" button on the driver dashboard must use the `tel:` protocol, be styled as a secondary but clear action (outline variant), and include the user's name if available to improve trust and coordination.
- **Marker Cleanup on Input Clear:** When a user clears a location input field (pickup or destination) using the cross icon, the corresponding marker MUST be removed from the map immediately by setting its `map` property to `null`. This keeps the visual map in sync with the input state.
- **Initial Pickup Sync:** When the map initializes and sets the initial pickup location (via geolocation or default), the pickup search input field must be explicitly synchronized with the geocoded address using `setPickupSearchValue`. This ensures the user sees their starting address immediately upon loading the booking interface.
- **Dismissible Google Map Card:** In the driver dashboard map, the default Google directions/place card is redundant and blocks screen space. We implement a beautiful floating close button (`X` icon) next to the card that slides/shifts the map iframe up and left out of view via negative margins when clicked, seamlessly expanding the visible map area.

## 🚖 Booking Request & Booking Flow
- **Request Again Button:** If a booking search times out or fails to find a driver, a "Request Again" button must appear, allowing the user to seamlessly retry the request without re-entering their pickup and destination.
- **Address-First Experience:** The booking flow emphasizes human-readable addresses for pickup and drop-off, rather than raw coordinates, across the user map, booking details, and driver dashboard.
- **Admin Role Booking Access:** Users with the `ADMIN` role are permitted to use user-facing features like booking history and active booking tracking. API routes (e.g., `/api/user/bookings`, `/api/booking/active`) must allow both `USER` and `ADMIN` roles to ensure Admins can test and use the booking flow as regular users.
- **Hide TIMED_OUT from User History:** Failed bookings (`TIMED_OUT`) are retained in the database for analytics but must be explicitly filtered out (`{ status: { not: "TIMED_OUT" } }`) from the user's Booking History page to avoid UI clutter and maintain a premium UX.
- **Dynamic Booking Request Timeout:** The booking search timeout duration is fully dynamic. It is configured in the database under the `BOOKING_REQUEST_TIMEOUT_MINUTES` setting key (default to **5 minutes**). The admin settings dashboard allows this to be configured dynamically between 1 and 30 minutes, automatically affecting the active client-side countdown timer, background auto-timeout cron, incoming request modal timer on the driver dashboard, and backend API active search calculations. (Added 2026-05-18)


## 🧑‍✈️ Driver Dashboard
- **Fullscreen Map Overlap:** In the driver panel, when the map is expanded to fullscreen from a ride request modal, it must sit correctly above the page header (ensuring proper z-index and layout management).
- **Geolocation Error Handling:** Geolocation timeouts and transient errors are handled gracefully. Unnecessary or spammy error notifications are suppressed to keep the driver's UI clean. Always log benign geolocation errors using `console.warn` instead of `console.error` to prevent triggering the Next.js development error overlay, and ensure objects like `GeolocationPositionError` are logged as `err.message` since they otherwise stringify to `{}`.
- **Profile Image in Header:** The driver's profile image is displayed in the header for a more personalized and premium experience, consistent with the user panel.
- **No Auto-Open Map Tabs:** When a driver accepts a booking request, the app must **not** automatically open Google Maps in a new tab or window, as this disrupts the UX by pulling the driver away from the main app interface. Driver navigation is handled explicitly via "Navigate" buttons in the Ongoing Booking view.
- **Conditional Sync Polling:** To optimize battery and data usage, the driver dashboard polling (`/api/sync`) is conditional. It only runs when the driver is either `ONLINE` or has an `activeBooking`. Polling is automatically paused when the driver is offline and idle, or when the "Arrived" modal is active. (Added 2026-05-15)
- **Layout Stability (Toggling Online):** To prevent layout shifting when toggling online/offline status, the dashboard uses `placeholderData: keepPreviousData` in its sync query. This ensures that the UI (including the Header) remains stable and interactive while the new status is being fetched. The Header and main page structure are kept outside the loading conditional to avoid "white flashes" or full-page unmounts. (Added 2026-05-16)
- **Incoming Request Modal UI/UX Redesign:** To optimize the driver's viewport and prevent visual clutter on small devices, the incoming request overlay uses a space-efficient vertical split deck design with a high-contrast dark blur backdrop (`bg-slate-900/75 backdrop-blur-md`), a clean horizontal split-row for fare/fees/distance details, coordinate-free timelines, and a floating map-overlay glass pill for Google Maps navigation. Standardized padding and margins (`p-5`, `gap-3.5`, `h-14`) ensure that no vertical scrolling is required. (Added 2026-05-18)
- **Driver Ongoing Trip Card UI/UX Polish:** The ongoing trip card on the driver dashboard uses a full-bleed, edge-to-edge `GoogleMapPreview` (removing double card margins and outer white spacing) with top-rounded corners. Spacing is strictly standardized using `space-y-5`, and the vertical timeline is simplified for low-literacy drivers, replacing complex icons with high-contrast emerald and crimson dots, and removing coordinates. All text strictly adheres to a three-font-size hierarchy (`text-xs`, `text-sm`, `text-2xl`), and all native `<button>` tags are replaced with `AppButton` components. (Added 2026-05-18)
- **Simplified 2-Button Trip Lifecycle (2026-05-21):** The driver trip flow uses exactly 2 action buttons per ride: "আমি পৌঁছেছি" (I Arrived → sets ARRIVED status) and "ট্রিপ শেষ করুন" (Complete Trip → sets COMPLETED directly from ARRIVED). There is NO "Start Ride" / "PICKED_UP" step in the UI. The ARRIVED → COMPLETED direct transition is intentional — fare is fixed, no mileage meter needed. The full-screen blocking fare modal has been replaced with an inline ARRIVED card that keeps map and navigation accessible. The `isArrivedOptimistic` pattern has been removed; server status drives all UI transitions.
- **Continuous Driver Audio Alert (2026-05-23):** Implemented a persistent, rhythmic audio alert (1.5-second intervals of an 880Hz-440Hz generated tone using the Web Audio API) for incoming ride booking requests. The alert is managed via `audioIntervalRef` to prevent memory leaks and duplicate loops. It is designed to stop instantly on any ending action: `handleReject`, `handleAccept`, manually toggling offline via `toggleOnline`, being forced offline via the `FORCED_OFFLINE` listener, or request timeout/dismissal. Bypassed over-aggressive React 19 linter warnings on ref access in render paths via inline `// eslint-disable-next-line react-hooks/refs` comments.
- **Driver Notification Mute (2026-05-24):** Added a Mute/Unmute alert toggle for incoming ride requests on the driver dashboard. This allows drivers to silence rhythmic alert tones during the current incoming ride request. The mute state is managed via React state and synchronized `useRef` (so that the non-reactive setInterval loop can inspect the value thread-safely) and automatically resets back to `false` when a new request is detected. The premium button includes an icon with a mandatory low-literacy label ("Mute" / "মিউট") and high-contrast, transition-enabled visual feedback (red pulsing when active).
- **Driver Route Preview Navigation (2026-05-24):** In the incoming ride request modal, clicking the "Navigate" button (floating Google Maps Overlay Pill) launches a Google Maps direction route pre-populated with both `origin` (pickup point) and `destination` (drop-off point). This allows drivers to preview the full route on external Google Maps before making an informed decision to accept or reject the request, reinforcing the address-first operational model.


## 📱 UI/UX & Design Standards
- **Premium Aesthetics:** The app uses modern web design principles (vibrant colors, smooth micro-animations, proper spacing). It should never look like a basic "minimum viable product".
- **Visual Hierarchy (Font Sizes):** Strictly limit to **max 3 font sizes** per screen to maintain a clean, high-end mobile experience.
- **Simple Language:** Use conversational tone and keep labels short (**max 2-3 words**). e.g., use "Cash" instead of "Payment Method".
- **Booking Visibility:** Always display **Fare, Time, and Distance** for all bookings. No essential booking or user data should ever be hidden.
- **Localization (No Hardcoded Strings):** All UI text must strictly use the central `TEXT` dictionary (`constants/text.ts`) to support English and Bengali seamlessly.
- **Clear Action Text:** All buttons and actionable elements must have explicit, action-oriented text.
- **Icon Labels:** Icons must always be accompanied by text labels to assist low-literacy users.
- **Consistent Spacing:** Always use design tokens for spacing; **no ad-hoc margins or paddings**.
- **Design System Tokens:** Prioritize using design system tokens (e.g., `primary`, `secondary`, `primary-foreground`) over hardcoded Tailwind color classes (e.g., `emerald-500`). This ensures that if the brand color changes, it can be updated in a single place (`globals.css`) rather than across hundreds of files.
- **Header Logo Purity:** The header logo should stand alone without additional identifying text (like "Admin Dashboard") next to it, maintaining a clean and minimalist brand presence across all panels.
- **Bangladesh CNG Color Consistency:** Bangladesh CNGs are culturally and legally recognized by their green color. To maintain authenticity and trust, all CNG vehicle assets (icons, illustrations, 3D models) used in the application MUST be full-body green.
- **UI Checklist:** Before implementing any UI, verify compliance with the checklist in [/docs/ui-rules.md](file:///Users/patwary/Projects/CNGLagbe/docs/ui-rules.md).

## ⚙️ Performance & Database
- **Direct Database Connections:** Prisma is configured with a dedicated direct URL and proper connection pooling to eliminate database performance overhead.
- **Parallel Queries:** API routes (like `/api/sync`) execute independent queries in parallel to optimize response times.
- **PostGIS Proximity Queries (Geography Casting):** In PostGIS geospatial queries (e.g., in `/api/booking/create` and `/api/sync`), coordinates stored as geometry degrees (`pickupLat`, `pickupLng`, `currentLat`, `currentLng`) MUST be cast to `::geography` (e.g., `ST_MakePoint(...)::geography`) before being passed to `ST_DWithin`. Otherwise, `ST_DWithin` calculates the radius in degrees instead of meters (e.g., treating a 3000m radius as 3000 degrees, matching every point globally). (Added 2026-05-24)


## 🏠 Landing Page (Homepage)
- **Full Landing Page Architecture:** The homepage (`app/page.tsx`) is now a full-length, conversion-optimized landing page — NOT a minimal centered card. It must contain all 11 sections: Hero, Local Trust, How It Works, Why Choose Us, Popular Routes, Features, Service Area, Testimonials, FAQ, Final CTA, and Footer.
- **Sticky Bottom CTA (Mobile):** A persistent `fixed bottom-0` bar with a prominent "Book Now" button must always be present. This is critical for mobile conversion. The padding-bottom on the footer must account for this bar (using `pb-28` on mobile).
- **Sticky CTA Contrast:** Always use `text-white` for all elements inside the green sticky button to ensure WCAG compliance against the brand primary color. Added a premium black logo mark for visual hierarchy.
- **No Call-to-Book:** The system strictly uses app-based booking to ensure proper booking tracking and safety. All "Call to Book" buttons have been removed.
- **No Driver Login Button:** The driver login button has been removed from the main landing page header to keep the primary landing page strictly user-focused.
- **Hero Section Height:** The hero section must have a `min-h-[740px]` to ensure all content (badges, text, image) fits perfectly without layout shifts.
- **Trust Badges in Hero:** The hero section must display badges: "১০০+ লোকাল ড্রাইভার", "নিরাপদ ও যাচাইকৃত", "দ্রুত পিকআপ", "ক্যাশে পেমেন্ট" to build immediate trust.
- **Animated Driver Count:** An animated green pulsing dot with "১০০+ ড্রাইভার সক্রিয়" must appear at the top of the hero to signal live service.
- **Popular Routes Section:** Quick-tap route cards (Bazar→Hospital, Home→School, etc.) directly call `handleBookNow`, giving users a fast path to booking.
- **FAQ Accordion:** The FAQ section uses a client-side accordion (no library) for SEO and UX. Questions are in Bangla-first, answers explain cash payment clearly.
- **Service Area SEO Block:** A dark section includes visible keywords ("CNG booking in Chhagalnaiya", "local CNG service", "CNG near me") for Google and AI search indexing.
- **Text Dictionary Compliance:** All landing page text lives in `constants/text.ts`. No hardcoded Bangla/English strings in `page.tsx`.
- **Testimonials Localization:** Testimonials in `app/page.tsx` are fully localized via `constants/text.ts`.
- **React.cloneElement Typing:** When using `React.cloneElement` with dynamic icons, always cast the element to `React.ReactElement<any>` to ensure compatibility with additional props like `className`.
- **Landing Page UI Polish (2026-05-03):** A full UI polish pass was applied. Key rules to preserve going forward:
  - **Section spacing:** All `<Section>` wrappers use `py-16 md:py-20` — do NOT vary per section.
  - **Font weight hierarchy:** Section headings = `font-extrabold`, subheadings/card titles = `font-semibold` or `font-bold`, body/sub text = `font-normal`.
  - **Trust badge "VERIFIED" style:** `font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full text-sm`.
  - **Why Choose Us:** Section uses `bg-gray-50` background to visually separate. Cards are `bg-white rounded-xl p-6 shadow-sm`. Icons are `w-8 h-8`.
  - **How It Works connector:** Uses `border-t-2 border-dashed border-gray-300` (was `h-0.5 bg-slate-200`). Step circles are `w-12 h-12 bg-primary text-white`.
  - **Route pills:** Use `hover:bg-primary hover:text-white` for clear interactive feedback. Padding is `px-4 py-2 text-sm`.
  - **Feature cards:** `bg-white border border-gray-100 rounded-xl p-6`. Icon circles are `w-10 h-10`.
  - **Service area marquee/keywords:** Opacity raised to 60% (`opacity-60`). Text is `text-sm`.
  - **Testimonials:** `min-h-[260px]` for equal card height. Avatar is `w-10 h-10`. Name is `font-semibold text-sm`, location is `text-xs text-slate-400`.
  - **FAQ:** Uses a single outer container `rounded-2xl border border-gray-100 overflow-hidden shadow-sm` with rows separated by `border-b border-gray-100`. Open rows get `bg-gray-50`. Chevron rotates `rotate-180` when open (no `+/-` toggle). Row padding is `py-5 px-4`.
  - **Footer CTA:** "Book Now" button uses `bg-white text-primary` on green background for strong contrast.
  - **Footer:** Links are `text-sm hover:text-green-500 transition-colors`. Column gap is `gap-8`. Copyright is `text-slate-400`.
  - **Sticky bottom bar:** `z-50`. Inner button wrapped in `max-w-sm mx-auto` div.
  - **Focus states:** All interactive elements have `focus:ring-2 focus:ring-primary` or equivalent for accessibility.
  - **Transitions:** All interactive elements use `transition-all duration-200` (standardized from mixed `duration-300/500`).
  - **Contrast Standards (Accessibility):** Subtext/subheadings use `text-slate-600` (on light) or `text-slate-300` (on dark) to ensure WCAG compliance. Never use `slate-400` or `slate-500` for body text on light backgrounds.
  - **Trust Badges:** Always use high-contrast combinations (e.g., `bg-white text-slate-700` with a border) when rendering badges over light sections.
  - **Footer Layout:** Footer must always match the `max-w-[1200px]` width of other sections for visual alignment.
  - **Phone-Call Booking Transition (2026-06-28):** Direct booking from the website is disabled. Clicking the booking buttons (Hero CTA, Mobile Sticky bottom CTA, Popular Route Pills, and Final CTA) triggers a Call Booking Modal showing hotline `01783721411` with a clipboard copy option and a direct click-to-call link. The mockup form in the Hero section is replaced with a static card displaying the hotline. "How It Works" and FAQs are aligned to explain call booking.


- **Adaptive Branding (Logo):** To ensure WCAG-compliant contrast across themes, the app uses multiple logo variants: `/logo_white.png` for dark and primary backgrounds (Admin/Landing Footer), and `/logo_dark_text.png` for light backgrounds (Driver/General). All variants maintain a consistent 4:1 aspect ratio and transparent backgrounds.
- **SolaimanLipi Font for Bengali:** The platform explicitly uses the **SolaimanLipi** font for all Bengali text (`--font-bangla`). This font provides superior readability and aesthetics for Bengali ligatures compared to standard Google Fonts like Hind Siliguri. It is self-hosted in `public/fonts/SolaimanLipi.woff`.
- **Standardized Spelling (Chhagalnaiya):** The Bengali spelling for Chhagalnaiya is standardized as "ছাগলনাইয়া".

## ✨ Premium Animations (Framer Motion)
- **Scroll Progress Bar:** A fixed primary-colored bar (`bg-primary`) at the very top (`top-0`) tracks the user's scroll progress through the landing page.
- **Hero Title Word Reveal:** The main hero headline must animate word-by-word with a staggered delay (`i * 0.1`) and spring transition for a high-end "entrance" feel. To prevent cropping of Bengali characters by `overflow-hidden`, each word container must have horizontal padding (e.g., `px-[0.1em]`). Additionally, to accommodate Bengali ligatures and vowel marks gracefully and prevent overlapping lines, the title line-height is set to a more generous `leading-[1.3] lg:leading-[1.2]`. (Fixed 2026-05-13, Updated lineheight 2026-05-27)
- **Parallax Background Elements:** Background decorative shapes (blobs, skewed divs) in the Hero section should use `useTransform` to move vertically on scroll at different speeds (e.g., `-200px` to `150px`).
- **Staggered Child Reveal:** All grid-based sections (Features, Routes, FAQ, Reviews) must use `containerVariants` (with `staggerChildren`) and `itemVariants` for a smooth, sequential "pop-in" effect as they enter the viewport.
- **Subtle Perpetual Motion:** Step numbers in "How It Works" use a Y-axis oscillation (`y: [0, -5, 0]`) to feel "alive" without being distracting.
- **Interactive Feedback:** Cards and buttons use `whileHover={{ scale: 1.05, y: -2 }}` or `whileHover={{ y: -10 }}` (for large cards) to provide tactile visual feedback.
- **Safe Animation Properties:** Stick to `opacity`, `scale`, `y`, and `x` for performance. Avoid animating properties that trigger layout repaints (like `height` or `width`) during scroll.
- **No Animation Blur:** Avoid using `filter: blur()` in reveal animations. Prefer sharp reveals using `opacity`, `y`, and `scale`.
- **No Character-Level Split for Bengali:** Never split Bengali strings into characters for animation (e.g., `split("")`). This breaks ligatures (যুক্তবর্ণ) and positioning of vowel signs (কার). Animate the entire block or use word-level animation if necessary.

## 🔒 Cross-Panel Stability
- **Mandatory 3-Panel Verification:** Any change to a shared file (Header.tsx, proxy.ts, auth.ts, text.ts, globals.css, layout.tsx, subdomain.ts, schema.prisma, Providers.tsx) MUST be verified across ALL three panels (User, Driver, Admin) before finalizing.
- **Safe Zones:** Files scoped to a single panel (e.g., `AdminDashboard.tsx`, `app/driver/dashboard/page.tsx`, `app/user/map/page.tsx`, panel-specific API routes under `app/api/driver/*`, `app/api/admin/*`, `app/api/user/*`) can be edited without cross-panel verification.
- **Danger Zones:** `Header.tsx` serves all roles via the `role` prop — always test all 4 variants (`landing`, `user`, `driver`, `admin`). `proxy.ts` handles middleware routing for all panels — test auth redirects for all roles. `constants/text.ts` — never remove or rename a key without grepping for it across the entire codebase.
- **Build Gates:** `npx tsc --noEmit` must pass with zero errors before any change is finalized. Console errors on any panel are a blocker.
- **Prisma Schema Changes:** After any `schema.prisma` edit, always run `npx prisma generate` and restart the dev server before testing.
- **Trip Start Timestamp (startedAt):** The `Booking` model includes a `startedAt` field (DateTime?) to track exactly when a trip begins (when the driver marks the passenger as picked up). This is separate from `acceptedAt` and is used for duration analytics and trip lifecycle management.
- **Prisma Migration Workaround (Supabase):** When running migrations on Supabase, `npx prisma migrate dev` may fail due to shadow database permission issues or missing table errors. In such cases, use `npx prisma db push` to synchronize the schema directly with the database, ensuring `npx prisma generate` is run immediately after.

## 🧑‍✈️ Driver Registration & Profile
- **Address & Nearby Bazar Fields:** Driver registration and profile management include `address` and `nearbyBazar` fields to facilitate local coordination and trust.
- **Removing Bluebook Requirement:** To streamline driver registration, the "Bluebook" (vehicle registration) document requirement has been removed from the database, API, and signup flow. The registration now requires only NID, Driving License, and the CNG Plate Number.
- **Prisma Client Sync:** After schema changes, `npx prisma generate` must be run and the server restarted to ensure the Prisma Client picks up the new fields and avoids `Unknown argument` errors.
- **Profile Header Dropdown:** The driver's name, ID, and profile link are tucked into a clean dropdown menu behind the profile image in the header, keeping the top navigation minimalist and focused.
- **Back Button Consistency:** The driver profile page uses a `Header` with a `showBack` prop and `onBack` handler to ensure consistent navigation back to the dashboard.

## 🛠️ Code Quality & Maintenance
- **Strict Linting Compliance:** The codebase maintains zero linting errors and warnings. Key practices include:
  - **Avoiding `any`:** Never use the `any` type in API routes or components. Always use specific types or `unknown` with type assertions (e.g., `error as Error`).
  - **Prisma Where Clauses:** For API endpoint filtering and queries, strongly type where clauses using specific inputs from Prisma (e.g., `Prisma.BookingWhereInput`, `Prisma.UserWhereInput`) instead of `any`. If conditions are constructed dynamically, use typed arrays (e.g., `const andConditions: Prisma.BookingWhereInput[] = []`) and aggregate them with `{ AND: andConditions }`.
  - **Non-Hoisted Variable Declarations:** In custom hooks, always define functions (e.g., `fetchBookings`) before they are accessed or called in standard `useEffect` hooks to prevent Temporal Dead Zone (TDZ) / access-before-declaration compiler or linter errors. If a data-fetching function performs synchronous state updates inside the effect, retain the `// eslint-disable-next-line react-hooks/set-state-in-effect` compiler directive to safely ignore the warning.
  - **Dead Code Removal:** Unused variables (like `_` in destructuring), imports, and props are strictly removed or handled to ensure build stability and clean code. (2026-05-11)
  - **Avoid Synchronous setState in Effects:** Avoid calling `setState` synchronously within the body of a `useEffect` hook, which can cause cascading renders and performance issues (e.g., `react-hooks/set-state-in-effect`). Instead, set state synchronously inside event handlers (e.g., input `onChange`, button `onClick`) and reserve effects for asynchronous operations or external subscriptions. (Added 2026-05-23)
- **Design System Enforcement (AppButton):** Native `<button>` elements are strictly prohibited in favor of the `AppButton` component. This ensures consistent styling, loading states, and tactile feedback across all panels. Even highly custom buttons (like the user menu toggle) must be wrapped in `AppButton` with `variant="ghost"` and appropriate overrides.

## 📝 Form Validation & State Management
- **Schemas First:** Every form MUST have a Zod schema defined in `lib/schemas/`.
- **Unified State (react-hook-form):** Use `react-hook-form` for all form state management. Avoid local `useState` for individual form fields.
- **Zod Resolver:** Connect schemas to forms using `@hookform/resolvers/zod`.
- **Standardized Fields:** Use the `FormField` component for all inputs to ensure consistent error styling and ref forwarding.
- **Step-wise Validation:** In multi-step forms, use `trigger(['field1', 'field2'])` to validate the current step before proceeding.
- **Type Safety:** Always export the input type using `z.infer<typeof schema>` for use in components and APIs.

- **Form Labels Consistency**: Ensured all input labels (FormField, SearchableSelect, and custom labels) use uppercase formatting with wide tracking for consistency (text-xs font-black tracking-widest text-slate-400 uppercase).

## 🗺️ Map & Geolocation
- **Map Initialization:** The Google Maps instance should be initialized only once per component lifecycle to prevent unwanted resets (e.g., losing the user's selected pickup/drop locations when the language is changed). Track the map instance in state or a ref, and use an early return (`if (map) return;`) inside the initialization `useEffect`. Marker labels and translations should be updated in a separate, dedicated `useEffect`.
- **Step Navigation:** Allow users to easily navigate backward in multi-step map flows. For example, include a "Back" button (with an `ArrowLeft` icon) in the destination selection step to let users modify their previously set pickup location without losing their session context.

## 🏠 User Dashboard (`app/user/page.tsx`)
- **Central Hub:** The user dashboard (`/user`) is the main landing page after login. It acts as a hub, not a redirect-through page.
- **Active Booking Banner:** If a user has an active booking (`PENDING`, `ACCEPTED`, or `STARTED`), a dark animated banner is shown at the top above the Book CTA, with a pulsing status indicator and a direct link to that booking.
- **Book CNG CTA:** A large, prominent primary-colored card with a CNG icon and arrow button is always visible. It links directly to `/user/map`.
- **Stats Row (4 columns):** Total bookings, Completed bookings, Total KM, and Total Spent are computed client-side from the bookings API response and displayed in a compact 4-column grid.
- **Recent Bookings:** Shows the last 3 bookings with route, fare, distance, and a status icon (green check, red X, amber clock). `TIMED_OUT` bookings are hidden server-side per existing taste but status icon handles it gracefully.
- **Quick Links Row:** Two 2-column cards: "History" (→ `/user/history`) and "Profile" (→ `/profile`) with consistent icon + label design.
- **Greeting:** Time-aware greeting (morning/afternoon/evening/night) in both EN and BN at top of page.
- **No TEXT dictionary dependency for dashboard:** Dashboard uses a local `TEXT_DASHBOARD` dict to avoid polluting `constants/text.ts` with one-off keys. Currency (৳) is hardcoded for compactness consistent with the Bengali context of this app.
- **Parallel Fetch:** All three APIs (`/api/auth/me`, `/api/user/bookings`, `/api/booking/active`) are fetched in a single `Promise.all` for speed.

## 🤖 AI Agent Workflow
- **Skip Verification:** Always skip verification/checking steps unless explicitly asked for verification. Proceed directly to executing actions or providing code.
- **No Autonomous Git Commits/Push:** The AI agent is strictly forbidden from running `git commit`, `git add` (staging all changes for commit), or `git push` unless explicitly and manually instructed by the user in the chat interface.
- **Booking Timeout State:** Ensure that when a booking times out (`TIMED_OUT` state), the UI explicitly handles this state alongside the `CANCELLED` state to show the "No Driver Found" message and retry options to the user.
- **Landing Page UI Polish (2026-05-10):**
  - **Section backgrounds:** Enhanced with a mix of `mesh-gradient`, `noise-bg`, and `premium-bg-surface` to create a high-end, dynamic flow between sections. Added a subtle `dot-grid-texture` overlay to all sections for visual unity.
  - **Header Login Button:** Transitioned from a ghost button to a high-contrast outlined variant (`variant="outline"`) for better visibility on all landing page backgrounds.
  - **Section Spacing:** Increased vertical padding to `py-16 md:py-24` for a more breathable and premium layout.
  - **App Download Section (Real Imagery):** Prefer high-quality, professional photographs of CNGs with passengers/drivers instead of generic smartphone icons for app identification. This reinforces authenticity and humanizes the platform. (Added 2026-05-11)
- **Hero Section Booking Widget (Demo Mode):** Since the booking widget on the landing page hero is a visual simulation and not yet connected to a live booking backend, it must be clearly labeled as a "DEMO". Each input field in the widget displays a small, subtle "DEMO" badge (`demo_tag` from `constants/text.ts`) to manage user expectations while maintaining a premium aesthetic. (Added 2026-05-11)
- **Login Page Header Background:** The header background on the main user login page must always be white (`theme="light"`) to ensure high contrast and a clean, premium entrance experience, rather than using the default brand green background. (Added 2026-05-12)
## 💳 Driver Wallet & Platform Fees
- **Platform Fee Model:** The platform charges a 5% platform fee on the base fare of every completed ride, with a minimum floor of **10 BDT**. This fee is added to the total fare shown to the passenger (Collect Amount) and deducted from the driver's wallet balance.
- **Wallet as Debt Tracker:** In our cash-only model, the driver's wallet acts as a debt tracker. Each completed ride results in a negative transaction (e.g., -10 BDT), increasing the driver's total debt to the admin.
- **Fare Breakdown Visibility:** The driver dashboard and active booking views must always display a granular fare breakdown: **Base Fare**, **Platform Fee**, and **Collect Amount** (Total). This ensures the driver knows exactly how much to collect from the passenger and why their wallet balance decreased.
- **Transaction History Context:** Every transaction in the driver's wallet history should include pickup and drop-off location names (where applicable) to help drivers cross-reference fees with specific trips.
- **Automated Fee Deduction:** Platform fees are automatically calculated and deducted from the driver's wallet balance within the same database transaction that marks a ride as `COMPLETED`. (Added 2026-05-15)
- **Wallet Transactions History Ledger:** Both the driver wallet dashboard and the admin driver modal feature a comprehensive transactions ledger. Each transaction lists: the exact amount (with proper green/red formatting and +/- sign), the date/time, localized transaction type badges (e.g., Booking Fee, Payment, Adjustment), and the granular trip details/pickup/destination where applicable. (Added 2026-05-17)
- **Multidimensional Transaction Filtering:** Both drivers and admins have access to time-frame filters (All, Today, Last Week, Last Month) and debit/credit type filters (All, Debit, Credit) to easily navigate through transactions history. (Added 2026-05-17)
- **Wallet Balance Cards:** The top of the ledger displays the driver's current wallet balance inside a stylized card for instant visibility, eliminating the need to display a running balance column per transaction row. (Added 2026-05-17)
- **Dynamic Platform Fee Percentage:** The platform fee percentage is dynamically configured. The calculation logic queries the database setting `PLATFORM_FEE_PERCENTAGE` with a safe fallback to the default seed value of `5%` if the setting is absent or corrupted. (Added 2026-05-17)
- **Admin Configuration Interface:** Admins can view and dynamically edit the platform fee percentage from the "Settings" tab in the Admin Dashboard. The percentage input supports values from 0 to 100 and displays clear percentage indicators. (Added 2026-05-17)
- **Bilingual Translation Support:** Settings labels, descriptions, and buttons must be fully localized via the central `TEXT` dictionary to maintain a professional, accessible multilingual UI for both English and Bangla. (Added 2026-05-17)
- **Dynamic Search Radius Setting:** The maximum radius in kilometers for matching driver partners with pending ride requests is configurable. The default starting threshold is **3 km**, and it can be dynamically adjusted by the admin between **1 km and 10 km** (in steps of 0.5 km) from the Admin settings dashboard. (Added 2026-05-18)
- **Bounding Box Pre-filtering:** To optimize PostGIS query speeds, coordinates bounding box calculations are extracted into a clean, reusable utility `getBoundingBox` in `lib/radius.ts` which is fully unit-tested to calculate correct coordinate bounding box boundaries. (Added 2026-05-18)
- **Dynamic CNG Per-Kilometer Rate:** The base CNG per-kilometer rate used for ride fare calculation is fully dynamic, configured under `CNG_PER_KM_RATE` in the `SystemSetting` table. The core `calculateFare` function accepts an optional parameter defaulting to **20 BDT/km** (updated from the legacy hardcoded 15 BDT/km). Fare calculations in the calculator route and the booking creation route dynamically load this configuration value to calculate passenger fares at runtime. (Added 2026-05-22)
- **CNG Rate Admin UI Controls:** The Admin Settings interface includes a dedicated card that allows admins to dynamically view and update the CNG per-kilometer rate, utilizing localizing key strings for translation consistency and updating settings instantly with single-card saving handlers. (Added 2026-05-22)
- **Mandatory Road Distance for Passenger Fares:** The Haversine formula is strictly prohibited for passenger fare calculation because straight-line measurements underestimate real driving road distances. Actual road distance (calculated via Google Maps Directions API on the client) is made a mandatory validation parameter on `/api/fare/calculate` and `/api/booking/create` backend APIs, throwing a strict `400 Bad Request` if missing or <= 0. (Added 2026-05-27)

## 🏗️ Admin Dashboard Architecture
- **Hyper-Granular Refactor:** The Admin Dashboard follows a strict separation of concerns. All business logic, data fetching, and state management live in the [useAdminDashboard](file:///Users/patwary/Projects/CNGLagbe/app/admin/hooks/useAdminDashboard.ts) custom hook. Presentational logic is split into individual tab components under `app/admin/components/tabs/`.
- **Shared Component Directory:** Common UI elements (badges, cards, modals) are centralized in `app/admin/components/shared/` and exposed via an `index.ts` file to ensure consistent styling and simplified imports across the dashboard.
- **TabNavigation Standardization:** The dashboard uses a unified `TabNavigation` component to handle tab switching, ensuring a consistent UI and reducing redundant navigation logic in the main entry point.
- **Type Safety Over `any`:** All component props in the admin dashboard use explicit TypeScript interfaces. The use of the `any` type is strictly avoided to ensure production stability.
- **Waitlist Stats Cards (2026-06-28):** The Waitlist tab features three premium metrics cards at the top showing the total waitlist counts (Total Waiting, Waiting Drivers, and Waiting Passengers). The counts are fetched in parallel on the server (`/api/admin/waitlist`) using `Promise.all` and integrated into the existing `waitlistMeta` state to prevent unnecessary network calls or database overhead.

## ⚠️ Passenger Complaint & Issue Report System
- **Authorized Reporter:** Only passengers are permitted to submit complaints against drivers. Driving partners cannot file reports against passengers to maintain the lightweight dispatch positioning.
- **Valid Ride Restriction:** Issue reports can only be filed on dynamic booking pages when the ride's status is either `COMPLETED` or `CANCELLED`, and a driver was successfully assigned (`driverId` is present). This prevents spamming on unaccepted bookings.
- **Uniqueness & UI Feedback Protection:** To prevent duplication, a passenger is strictly restricted to a single report per booking. The backend API checks for existing reports and rejects duplicates. On the frontend, if a report already exists, the "Report Driver" button is rendered as a beautifully disabled, pastel reddish-gray button exhibiting "Reported" (অভিযোগ দায়ের করা হয়েছে).
- **Bengalized Visual Predefined Reasons:** Dropdown reasons are fully localized (Base Fare, Behavior, Delayed Arrival, Lost Items, Other) to ensure readability for all literacy levels, styled using colored cards with radio checkboxes.
- **Mandatory Admin Resolution Notes:** Administrative resolution action strictly requires marking status as `RESOLVED` and submitting a mandatory `resolutionNote` documenting warning outcomes or fare adjustments.

## 📊 Unified Search, Pagination & Filtering in Tables
- **Hybrid Search/Filter Strategy:** Tables in CNGLagbe utilize a hybrid approach:
  - **Server-Side Filtering & Search:** Heavy lists with high volumes (e.g., Users, Bookings) implement server-side search and filtering via API parameters. Text search filters against user profiles (name, phone) and active relations (passenger, driver).
  - **Client-Side Filtering & Search:** Lightweight static lists (e.g., Bazars) implement responsive client-side in-memory filter logic to keep queries fast and instant.
- **Visual Premium Headers:** Every searchable/filterable table card header features a clean responsive layout with a search input (prefixed with a `Search` icon) and a status/role select dropdown (prefixed with a `Filter` icon).
- **Page Resets on Search/Filter:** Whenever a user types into a search input or modifies a filter, the pagination page state MUST be programmatically reset to the first page (`currentPage = 1` or `setPage(1)`) to avoid displaying blank empty states.
- **Driver History Debounced Search:** The driver trip history page features a highly optimized server-driven search with a client-side debounce of **400ms** to prevent redundant database requests. The search field dynamically queries Trip/Booking IDs, passenger names, phone numbers, and pickup/destination addresses case-insensitively using Prisma's `{ contains, mode: "insensitive" }` operators. Typing in the search input shows a smooth animated spinner inline, and immediately clears when the user clicks the integrated `X` button or clears the input. (Added 2026-05-18)

## 🚗 Driver Trip Lifecycle (2026-05-21)
- **2-Button Lifecycle (No Button Fatigue):** The driver trip flow is streamlined to exactly 2 actions: `I Arrived` and `Complete Trip`. The old `Start Ride` / `PICKED_UP` step was removed from the UI as fare is fixed and no mileage meter is needed. This prevents cognitive overload for local rural drivers.
- **ARRIVED Status (New DB State):** A new `ARRIVED` status and `arrivedAt DateTime?` field were added to the `Booking` model. This allows the backend to correctly distinguish between "driver en route" (`ACCEPTED`) and "driver waiting at pickup" (`ARRIVED`), without conflating it with the legacy `PICKED_UP` state (kept for backward compatibility only).
- **Strict Status Guard on /api/driver/arrived:** The arrived API now transitions `ACCEPTED → ARRIVED` (not `PICKED_UP`). The `isOnline: false` update was removed from the accept flow so location tracking continues uninterrupted throughout the trip.
- **Complete Route Accepts ARRIVED or PICKED_UP:** The `/api/driver/complete` route now accepts bookings in both `ARRIVED` and `PICKED_UP` state, ensuring backward compatibility.
- **Driver Dashboard Arrived Modal — Amber Waiting Theme:** The modal shown after the driver taps "I Arrived" uses an amber/warning color theme (not the green trip-active theme) to visually communicate the "waiting for passenger" state. The CTA now reads "Complete Trip" (not "Finish Trip & Go Online").
- **User Booking Page — DRIVER_ARRIVED State:** A distinct amber-themed UI block was added for the `DRIVER_ARRIVED` ui state. The page shows a pulsing MapPin icon and the `driver_arrived_info` text, with a Call Driver button. The 15-minute cancellation countdown continues running during `ARRIVED` status.
- **All Active-Booking APIs Updated:** `/api/sync`, `/api/booking/active`, and the user booking page now include `ARRIVED` in all "active booking" status filters so the user and driver never lose their booking context when the status transitions to `ARRIVED`.
- **Arrived Phase Navigation:** Added destination navigation support to the `ARRIVED` phase of the booking lifecycle on the driver dashboard. The UI now displays a neat inline navigation link under the destination address, and a prominent full-width **Navigate** action button next to the Call User and Start/Complete action buttons. Clicking either of these launches external Google Maps directions from the driver's current position to the destination (`https://www.google.com/maps/dir/?api=1&destination=destLat,destLng`).

## 🔔 Push Notifications (FCM)
- **No Mock Token Fallback (2026-05-25):** The `useDriverFCM` hook must NEVER generate fallback mock tokens (`mock_fcm_token_dev_...`). Mock tokens stored in `DriverPushToken` cause Firebase Admin SDK to reject all push broadcasts with `messaging/invalid-argument`. If `getToken()` fails, the hook returns `false` and logs actionable diagnostics — the driver proceeds without push capability.
- **15-Second Token Timeout (2026-05-25):** FCM `getToken()` requires service worker installation, VAPID key exchange, push subscription creation, and token registration with Google servers. This routinely takes 5–15 seconds on first registration. The timeout is set to 15 seconds (previously 3 seconds which always lost the race).
- **Server-Side Token Validation (2026-05-25):** The `/api/driver/push-token` POST handler rejects tokens that start with `mock_` or are shorter than 50 characters. Real FCM registration tokens are 100+ character base64-like strings. This prevents invalid tokens from ever being stored in the database.
- **VAPID Key Verification:** The `NEXT_PUBLIC_FIREBASE_VAPID_KEY` in `.env.local` must match the Web Push certificate in the Firebase Console (Project Settings → Cloud Messaging → Web Push Certificates). A mismatch causes silent `getToken()` failures.

## 🌐 Domain & Environment Flexibility
- **Environment and Domain Flexibility (2026-05-26):** Production routing and access controls are relaxed for staging/preview domains to enable full website browsing and testing:
  - **Main-Domain-Only Redirection:** In `proxy.ts`, the production restriction that redirects non-landing and non-API requests back to the root page (`/`) is constrained to `useConfiguredDomains`. This ensures that alternate staging/preview domains (such as Vercel preview deployments `*.vercel.app` or custom testing domains) do not trigger redirection and can access all pages.
  - **Branded Cookie Restrictions:** Cookie domain assignment in `LanguageContext.tsx` is limited to configured domains (`cnglagbe.com` and its subdomains) in production. Browsing on staging/preview domains omits the hardcoded `.cnglagbe.com` domain parameter, allowing browsers to successfully store cookies.
  - **Dynamic Booking Accessibility:** The "Coming Soon" visual restriction on the landing page's main booking flow button in `app/page.tsx` is only active in production when accessing the configured production host. Tapping the booking button on alternative preview/staging domains immediately routes users to `/login` or `/user/map` to facilitate full functional testing of the booking system.

## ⚡ Performance Optimization & Next.js Best Practices
- **Next.js Image Sizes Prop (2026-06-28):** All `<Image />` components utilizing the `fill` attribute must specify a descriptive `sizes` prop. This optimizes the source set (srcset) generation and avoids default full-screen viewport scaling warnings (e.g. download cards, profile photos, background images, and icon banners).

## 🗄️ Database & Schema Synchronization
- **Waitlist Database Table Synchronization (2026-06-28):** The interactive waitlist requires the `Waitlist` model in `schema.prisma` to be synchronized with the remote PostgreSQL database. Ensure migrations or `npx prisma db push` are successfully executed to resolve runtime `table public.Waitlist does not exist` errors.
- **Waitlist Location Field (2026-06-29):** The `Waitlist` schema includes a `location String?` field to record the user's area/bazar at signup. Zod validation ensures new signups submit a non-empty location, and the admin dashboard displays this location inline under the user's name/phone to optimize layout width on mobile screens.

## 🛠️ Compilation, Typings & Linting (2026-07-04)
- **Unified Tab Types:** Shared `TabNavigation` imports and re-exports `AdminTab` from `useAdminDashboard` to automatically stay in sync with dashboard tab modifications.
- **Button Variant & Size Extensions:** `AppButton` supports standard `success` (green) and `danger` (red) variants and a responsive `size` prop (`"sm" | "md" | "lg"`, defaulting to `"md"`) to support inline list actions cleanly.
- **Duplicate Text Key Avoidance:** Translation keys in `text.ts` must never collide. Status keys for contributed items are isolated under `contributed_approved`/`contributed_pending` (to display proper Bengali terms without conflicting with main driver/booking status keys).
- **Admin Contributed Drivers Route Authorization (2026-07-04):** Refactored `/api/admin/contributed-drivers` and `[id]/route.ts` to use centralized `getAuthenticatedAdmin()` instead of custom `verifyAdmin()`. The custom helper had a bug where it tried to read the authentication token from a cookie named `"token"`, whereas the authentication system uses `"auth_token"`, causing unauthorized responses that blocked contributed drivers from appearing in the admin dashboard.
