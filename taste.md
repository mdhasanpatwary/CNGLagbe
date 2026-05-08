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
- **Admin Role Booking Access:** Users with the `ADMIN` role are permitted to use user-facing features like booking history and active ride tracking. API routes (e.g., `/api/user/bookings`, `/api/booking/active`) must allow both `USER` and `ADMIN` roles to ensure Admins can test and use the ride flow as regular users.


## 🧑‍✈️ Driver Dashboard
- **Fullscreen Map Overlap:** In the driver panel, when the map is expanded to fullscreen from a ride request modal, it must sit correctly above the page header (ensuring proper z-index and layout management).
- **Geolocation Error Handling:** Geolocation timeouts and transient errors are handled gracefully. Unnecessary or spammy error notifications are suppressed to keep the driver's UI clean.
- **Profile Image in Header:** The driver's profile image is displayed in the header for a more personalized and premium experience, consistent with the user panel.

## 📱 UI/UX & Design Standards
- **Premium Aesthetics:** The app uses modern web design principles (vibrant colors, smooth micro-animations, proper spacing). It should never look like a basic "minimum viable product".
- **Visual Hierarchy (Font Sizes):** Strictly limit to **max 3 font sizes** per screen to maintain a clean, high-end mobile experience.
- **Simple Language:** Use conversational tone and keep labels short (**max 2-3 words**). e.g., use "Cash" instead of "Payment Method".
- **Ride Visibility:** Always display **Fare, Time, and Distance** for all rides. No essential ride or user data should ever be hidden.
- **Localization (No Hardcoded Strings):** All UI text must strictly use the central `TEXT` dictionary (`constants/text.ts`) to support English and Bengali seamlessly.
- **Clear Action Text:** All buttons and actionable elements must have explicit, action-oriented text.
- **Icon Labels:** Icons must always be accompanied by text labels to assist low-literacy users.
- **Consistent Spacing:** Always use design tokens for spacing; **no ad-hoc margins or paddings**.
- **Design System Tokens:** Prioritize using design system tokens (e.g., `primary`, `secondary`, `primary-foreground`) over hardcoded Tailwind color classes (e.g., `emerald-500`). This ensures that if the brand color changes, it can be updated in a single place (`globals.css`) rather than across hundreds of files.
- **Header Logo Purity:** The header logo should stand alone without additional identifying text (like "Admin Dashboard") next to it, maintaining a clean and minimalist brand presence across all panels.
- **UI Checklist:** Before implementing any UI, verify compliance with the checklist in [/docs/ui-rules.md](file:///Users/patwary/Projects/CNGLagbe/docs/ui-rules.md).

## ⚙️ Performance & Database
- **Direct Database Connections:** Prisma is configured with a dedicated direct URL and proper connection pooling to eliminate database performance overhead.
- **Parallel Queries:** API routes (like `/api/sync`) execute independent queries in parallel to optimize response times.

## 🏠 Landing Page (Homepage)
- **Full Landing Page Architecture:** The homepage (`app/page.tsx`) is now a full-length, conversion-optimized landing page — NOT a minimal centered card. It must contain all 11 sections: Hero, Local Trust, How It Works, Why Choose Us, Popular Routes, Features, Service Area, Testimonials, FAQ, Final CTA, and Footer.
- **Sticky Bottom CTA (Mobile):** A persistent `fixed bottom-0` bar with a prominent "Book Now" button must always be present. This is critical for mobile conversion. The padding-bottom on the footer must account for this bar.
- **No Call-to-Book:** The system strictly uses app-based booking to ensure proper ride tracking and safety. All "Call to Book" buttons have been removed.
- **Trust Badges in Hero:** The hero section must display badges: "১০০+ লোকাল ড্রাইভার", "নিরাপদ ও যাচাইকৃত", "দ্রুত পিকআপ", "ক্যাশে পেমেন্ট" to build immediate trust.
- **Animated Driver Count:** An animated green pulsing dot with "১০০+ ড্রাইভার সক্রিয়" must appear at the top of the hero to signal live service.
- **Popular Routes Section:** Quick-tap route cards (Bazar→Hospital, Home→School, etc.) directly call `handleBookNow`, giving users a fast path to booking.
- **FAQ Accordion:** The FAQ section uses a client-side accordion (no library) for SEO and UX. Questions are in Bangla-first, answers explain cash payment clearly.
- **Service Area SEO Block:** A dark section includes visible keywords ("CNG booking in Chhagalnaiya", "local auto rickshaw service", "CNG near me") for Google and AI search indexing.
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

- **Unified Branding (Logo):** The app uses a single, unified 4:1 aspect ratio logo file (`/logo.png`) with a transparent background across all panels (Admin, Driver, User) and landing pages (Header and Footer). This ensures consistent branding and fits perfectly within the modern header design.
- **Standardized Spelling (Chhagalnaiya):** The Bengali spelling for Chhagalnaiya is standardized as "ছাগলনাইয়া" (using 'ছ' and 'য়'). Avoid variations like "চাঁগলনাইয়া" or "ছাগলনাইয়া". This must be consistent across `constants/text.ts` and `app/layout.tsx` metadata.

## ✨ Premium Animations (Framer Motion)
- **Scroll Progress Bar:** A fixed primary-colored bar (`bg-primary`) at the very top (`top-0`) tracks the user's scroll progress through the landing page.
- **Hero Title Word Reveal:** The main hero headline must animate word-by-word with a staggered delay (`i * 0.1`) and spring transition for a high-end "entrance" feel.
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

## 🧑‍✈️ Driver Registration & Profile
- **Address & Nearby Bazar Fields:** Driver registration and profile management include `address` and `nearbyBazar` fields to facilitate local coordination and trust.
- **Removing Bluebook Requirement:** To streamline driver registration, the "Bluebook" (vehicle registration) document requirement has been removed from the database, API, and signup flow. The registration now requires only NID, Driving License, and the CNG Plate Number.
- **Prisma Client Sync:** After schema changes, `npx prisma generate` must be run and the server restarted to ensure the Prisma Client picks up the new fields and avoids `Unknown argument` errors.
- **Profile Header Dropdown:** The driver's name, ID, and profile link are tucked into a clean dropdown menu behind the profile image in the header, keeping the top navigation minimalist and focused.
- **Back Button Consistency:** The driver profile page uses a `Header` with a `showBack` prop and `onBack` handler to ensure consistent navigation back to the dashboard.

## 🛠️ Code Quality & Maintenance
- **Strict Linting Compliance:** The codebase maintains zero linting errors and warnings. Key practices include:
  - **Avoiding `any`:** Never use the `any` type in API routes or components. Always use specific types or `unknown` with type assertions (e.g., `error as Error`).
  - **Dead Code Removal:** Unused variables (like `_` in destructuring) should be removed or handled by deleting keys from cloned objects to avoid compiler warnings.
- **Design System Enforcement (AppButton):** Native `<button>` elements are strictly prohibited in favor of the `AppButton` component. This ensures consistent styling, loading states, and tactile feedback across all panels. Even highly custom buttons (like the user menu toggle) must be wrapped in `AppButton` with `variant="ghost"` and appropriate overrides.

## 📝 Form Validation & State Management
- **Schemas First:** Every form MUST have a Zod schema defined in `lib/schemas/`.
- **Unified State (react-hook-form):** Use `react-hook-form` for all form state management. Avoid local `useState` for individual form fields.
- **Zod Resolver:** Connect schemas to forms using `@hookform/resolvers/zod`.
- **Standardized Fields:** Use the `FormField` component for all inputs to ensure consistent error styling and ref forwarding.
- **Step-wise Validation:** In multi-step forms, use `trigger(['field1', 'field2'])` to validate the current step before proceeding.
- **Type Safety:** Always export the input type using `z.infer<typeof schema>` for use in components and APIs.

- **Form Labels Consistency**: Ensured all input labels (FormField, SearchableSelect, and custom labels) use uppercase formatting with wide tracking for consistency (text-xs font-black tracking-widest text-slate-400 uppercase).
