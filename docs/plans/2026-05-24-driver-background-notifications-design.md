# Design: Driver Background Notifications via Firebase Cloud Messaging (FCM)

This design document outlines the implementation of background push notifications using Firebase Cloud Messaging (FCM) to alert drivers of incoming ride requests when their browser tab is inactive, locked, or in the background.

## 1. Problem Statement
Drivers on CNGLagbe currently rely on standard browser-based HTTP polling and real-time Supabase channels to receive ride requests. When their mobile browser tab goes to the background or the device screen locks, the browser throttles these active connections and timers to preserve battery. As a result, drivers miss incoming requests, leading to ride request timeouts and poor booking reliability.

## 2. Proposed Solution
We will implement a reliable, future-proof background notification system powered by **Firebase Cloud Messaging (FCM)**. 
- **Future Ready:** Unifies push notification infrastructure across the current Web/PWA client and a future React Native app.
- **Background Support:** Browser Native Service Worker handles push notifications when the tab is completely suspended or hidden.
- **Explicit Opt-in:** Registers push subscription only when the driver explicitly sets their status to **Online**.

---

## 3. Architecture & Data Flow

### A. Database Schema
We will store the active FCM registration token for each online driver in a dedicated `DriverPushToken` table to avoid polluting the `Driver` model.

```prisma
model DriverPushToken {
  id        String   @id @default(cuid())
  driverId  String   @unique
  token     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  driver    Driver   @relation(fields: [driverId], references: [id], onDelete: Cascade)
}
```

### B. Client Registration Flow (Web/PWA)
1. When the driver toggles their status to **Online** via `toggleOnline()` on `/driver/dashboard`:
   - Request Notification Permission using standard browser APIs.
   - If granted, initialize Firebase App and fetch the unique device FCM Token using `getToken(messaging, { vapidKey: ... })`.
   - Send a POST request to `/api/driver/push-token` with the token. The server upserts the token in the `DriverPushToken` table.
2. When the driver toggles **Offline** or logs out:
   - Call `/api/driver/push-token` with `{ token: null }` (or DELETE) to remove the token from the database, ensuring no ghost notifications are sent.

### C. Server-Side Broadcast Flow (Next.js API)
Inside `/api/booking/create/route.ts` (upon successful booking creation):
1. Query nearby online, approved, and non-suspended drivers within the configured `DRIVER_SEARCH_RADIUS_KM` (leveraging our existing optimized geospatial bounding box query).
2. Fetch the active `DriverPushToken` for all matching drivers in a single Prisma query.
3. Use the `firebase-admin` SDK to broadcast high-priority push notifications to these tokens in parallel.
4. **Payload Details:**
   - **Notification Title:** `নতুন রাইড রিকুয়েস্ট! 🛺` (New Ride Request!)
   - **Notification Body:** `ভাড়া: {totalFare} BDT | দূরত্ব: {distance} KM`
   - **Data Payload:** `{ bookingId, pickupAddress, destAddress }`

### D. Service Worker Handler (`public/firebase-messaging-sw.js`)
We will create a custom Web Service Worker file that:
1. Listens for incoming `push` events containing FCM notification payloads.
2. Handles background notifications using `onBackgroundMessage`.
3. Handles the `notificationclick` event to open, focus, or redirect the driver dashboard page.

---

## 4. Environment Configuration
To keep secret keys safe, we use environment variables. The driver's private key will never be shared or hardcoded.

```env
# Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBLMWfLTGrCAwymO7_UsJnBO6WdtslZhVo
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cnglagbe-fc603.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cnglagbe-fc603
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=cnglagbe-fc603.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=81068169673
NEXT_PUBLIC_FIREBASE_APP_ID=1:81068169673:web:5c0458ac653e0518c23018
NEXT_PUBLIC_FIREBASE_VAPID_KEY=... # User-generated VAPID key

# Server Configuration
FIREBASE_CLIENT_EMAIL=... # User-generated Client Email
FIREBASE_PRIVATE_KEY="..." # User-generated Private Key
```

---

## 5. Verification & Testing Plan
- **Verification of Registration:** Turn driver status Online and verify that:
  - Notification permission dialog is displayed.
  - A valid FCM token is generated and logged.
  - The token is successfully saved in the database under the driver's ID.
- **Verification of Unregistration:** Turn driver status Offline and verify that the token is deleted from the `DriverPushToken` table.
- **Verification of Background Push:** Simulating a new booking creation when the driver tab is inactive or minimized, verifying a native system notification is delivered with correct fare and distance details.
- **Verification of Click Action:** Tapping the notification successfully focuses the driver's browser tab and displays the active booking modal.
