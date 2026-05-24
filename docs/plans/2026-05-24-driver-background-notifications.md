# Driver Background Notifications Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement a background push notification system for drivers using Firebase Cloud Messaging (FCM) so they receive ride requests when the browser tab is inactive, closed, or locked.

**Architecture:** 
1. Database Schema: Create a `DriverPushToken` table to store 1:1 active FCM registration tokens for online drivers.
2. Client Flow: Create `hooks/useDriverFCM.ts` to request browser notification permission, fetch the device FCM registration token, and register it via `/api/driver/push-token` when going Online. De-register on toggling Offline or logout.
3. Service Worker: Place `public/firebase-messaging-sw.js` to handle background push messages, displaying native OS notifications and focusing the active driver dashboard on click.
4. Server Broadcast: Update booking creation (`/api/booking/create/route.ts`) to fetch nearby online drivers' push tokens and broadcast push notifications using `firebase-admin` in parallel.

**Tech Stack:** Next.js (App Router), Firebase Web SDK (`firebase`), Firebase Admin SDK (`firebase-admin`), Prisma ORM, PostgreSQL.

---

### Task 1: Install Firebase & Firebase Admin SDK Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Add dependencies to package.json**
Modify `package.json` to include `"firebase": "^10.8.0"` and `"firebase-admin": "^12.0.0"` in the `dependencies` object.

**Step 2: Run npm install**
Run: `npm install`
Expected: Output showing successful installation of dependencies.

**Step 3: Verify package installation**
Run: `npm list firebase firebase-admin`
Expected: `firebase` and `firebase-admin` packages listed at the correct versions.

---

### Task 2: Update Database Schema and Run Migration

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Define relation on Driver model**
Add the relation field `pushToken DriverPushToken?` in the `Driver` model inside `prisma/schema.prisma`:
```prisma
model Driver {
  // ... other fields
  pushToken       DriverPushToken?
}
```

**Step 2: Define DriverPushToken model**
Define the `DriverPushToken` model in `prisma/schema.prisma`:
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

**Step 3: Run migration to update database schema**
Run: `npx prisma migrate dev --name add_driver_push_token`
Expected: The migration runs successfully on the local shadow and development database, and the Prisma client is regenerated.

---

### Task 3: Create Server-Side API for FCM Token Upsert / Delete

**Files:**
- Create: `app/api/driver/push-token/route.ts`

**Step 1: Implement GET, POST, and DELETE handlers**
Write the handlers inside `app/api/driver/push-token/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedDriver } from "@/lib/auth";

export async function GET() {
  try {
    const driverId = await getAuthenticatedDriver();
    if (!driverId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pushToken = await prisma.driverPushToken.findUnique({
      where: { driverId },
    });

    return NextResponse.json({ pushToken });
  } catch (error) {
    console.error("GET Driver Push Token Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const driverId = await getAuthenticatedDriver();
    if (!driverId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await request.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const pushToken = await prisma.driverPushToken.upsert({
      where: { driverId },
      update: { token },
      create: { driverId, token },
    });

    return NextResponse.json({ pushToken });
  } catch (error) {
    console.error("POST Driver Push Token Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const driverId = await getAuthenticatedDriver();
    if (!driverId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.driverPushToken.deleteMany({
      where: { driverId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Driver Push Token Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

**Step 2: Verify compilation**
Run: `npx tsc --noEmit`
Expected: Compilation passes without typescript errors in the new api file.

---

### Task 4: Initialize Firebase Client Config & Permission Flow

**Files:**
- Create: `hooks/useDriverFCM.ts`

**Step 1: Implement the custom hook useDriverFCM**
Write the hook in `hooks/useDriverFCM.ts`:
```typescript
import { useEffect, useState } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, Messaging } from "firebase/messaging";
import { apiFetch } from "@/utils/api";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function useDriverFCM() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [messaging, setMessaging] = useState<Messaging | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const initMessaging = (): Messaging | null => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return null;
    }
    try {
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      const msg = getMessaging(app);
      setMessaging(msg);
      return msg;
    } catch (e) {
      console.error("Firebase client initialization failed", e);
      return null;
    }
  };

  const registerToken = async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false;
    }

    try {
      const currentPermission = await Notification.requestPermission();
      setPermission(currentPermission);

      if (currentPermission !== "granted") {
        return false;
      }

      const activeMessaging = messaging || initMessaging();
      if (!activeMessaging) return false;

      // Register or find service worker
      const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
        scope: "/firebase-cloud-messaging-push-scope",
      });

      const token = await getToken(activeMessaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: reg,
      });

      if (token) {
        const response = await apiFetch("/api/driver/push-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        return response.ok;
      }
      return false;
    } catch (error) {
      console.error("Error registering push token:", error);
      return false;
    }
  };

  const deregisterToken = async (): Promise<boolean> => {
    try {
      const response = await apiFetch("/api/driver/push-token", {
        method: "DELETE",
      });
      return response.ok;
    } catch (error) {
      console.error("Error deregistering push token:", error);
      return false;
    }
  };

  return {
    permission,
    registerToken,
    deregisterToken,
  };
}
```

---

### Task 5: Integrate Token Registration with toggleOnline on Driver Dashboard

**Files:**
- Modify: `app/driver/dashboard/page.tsx`

**Step 1: Update toggleOnline implementation**
Modify `toggleOnline` in `app/driver/dashboard/page.tsx` to handle permission requesting and token registration:
- Import `useDriverFCM` at the top of the file:
  `import { useDriverFCM } from "@/hooks/useDriverFCM";`
- Inside the component, invoke `const { registerToken, deregisterToken } = useDriverFCM();`
- Update `toggleOnline` to register the push token before setting status to online on the backend, and to deregister the token when going offline:
```typescript
  const { registerToken, deregisterToken } = useDriverFCM();

  const toggleOnline = async () => {
    clearAudioInterval();
    try {
      const nextStatus = !isOnline;
      setIsOnlineOverride(nextStatus);

      if (nextStatus) {
        // Driver is attempting to go Online
        const registrationSuccess = await registerToken();
        if (!registrationSuccess) {
          toast.warning(t("notification_permission_denied_warning") || "বিজ্ঞপ্তি অনুমতি দিন যাতে ব্যাকগ্রাউন্ডেও রাইড রিকুয়েস্ট পান!");
        }
      } else {
        // Driver is going Offline
        await deregisterToken();
      }

      const res = await apiFetch("/api/driver/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isOnline: nextStatus })
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["driverSync"] });
      } else {
        setIsOnlineOverride(null);
      }
    } catch (e) {
      console.error(e);
      setIsOnlineOverride(null);
    }
  };
```

---

### Task 6: Create Service Worker for Background Notification Handling

**Files:**
- Create: `public/firebase-messaging-sw.js`

**Step 1: Implement the service worker**
Write the service worker script in `public/firebase-messaging-sw.js`:
```javascript
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBLMWfLTGrCAwymO7_UsJnBO6WdtslZhVo",
  authDomain: "cnglagbe-fc603.firebaseapp.com",
  projectId: "cnglagbe-fc603",
  storageBucket: "cnglagbe-fc603.firebasestorage.app",
  messagingSenderId: "81068169673",
  appId: "1:81068169673:web:5c0458ac653e0518c23018"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'নতুন রাইড রিকুয়েস্ট! 🛺';
  const notificationOptions = {
    body: payload.notification?.body || 'ভাড়া এবং দূরত্বের বিবরণ দেখতে ক্লিক করুন',
    icon: '/driver_app_icon.png',
    badge: '/icons/driver-icon-512.svg',
    data: payload.data,
    requireInteraction: true
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = new URL('/driver/dashboard', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
```

---

### Task 7: Implement Server-Side Broadcast on Booking Creation

**Files:**
- Create: `lib/firebase-admin.ts`
- Modify: `app/api/booking/create/route.ts`

**Step 1: Implement the Firebase Admin initialization utility**
Write `lib/firebase-admin.ts`:
```typescript
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (privateKey && clientEmail && projectId) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });
  } else {
    console.warn("Firebase Admin environment variables are incomplete. Push notifications will be skipped.");
  }
}

export const messagingAdmin = admin.apps.length ? admin.messaging() : null;
```

**Step 2: Update Booking creation API route to query and broadcast to driver push tokens**
Update the broadcast logic in `app/api/booking/create/route.ts`.
- Locate the booking creation point (after `prisma.booking.create(...)`).
- Query active push tokens of matching drivers within search radius in parallel with existing flows.
- Use `messagingAdmin` to broadcast high-priority push notifications to all matching drivers.
```typescript
import { messagingAdmin } from "@/lib/firebase-admin";

// Inside POST handler:
// 1. Fetch nearby driver push tokens using the bounding box matching drivers:
const nearbyDrivers = await prisma.driver.findMany({
  where: {
    isOnline: true,
    isApproved: true,
    isSuspended: false,
    // Add same bounding box or proximity checks as user match search
    currentLat: { gte: minLat, lte: maxLat },
    currentLng: { gte: minLng, lte: maxLng },
  },
  select: {
    id: true,
    pushToken: {
      select: { token: true }
    }
  }
});

const pushTokens = nearbyDrivers
  .map((d) => d.pushToken?.token)
  .filter((t): t is string => !!t);

if (pushTokens.length > 0 && messagingAdmin) {
  const message = {
    notification: {
      title: "নতুন রাইড রিকুয়েস্ট! 🛺",
      body: `ভাড়া: ${totalFare} BDT | দূরত্ব: ${distance.toFixed(1)} KM`,
    },
    data: {
      bookingId: booking.id,
      pickupAddress: booking.pickupAddress || "",
      destAddress: booking.destAddress || "",
    },
    tokens: pushTokens,
  };

  messagingAdmin.sendEachForMulticast(message)
    .then((response) => {
      console.log(`Successfully sent ${response.successCount} push notifications; failed: ${response.failureCount}`);
    })
    .catch((error) => {
      console.error("Error broadcasting push notifications:", error);
    });
}
```

---

### Task 8: Add Translation Keys for Notification UI

**Files:**
- Modify: `constants/text.ts`

**Step 1: Add notification localization strings**
Modify `constants/text.ts` to add standard strings for notification warning banner and toasts in both English and Bangla.
```typescript
  notification_permission_denied_warning: {
    en: "Enable notifications to receive background ride alerts when the tab is closed!",
    bn: "বিজ্ঞপ্তি অনুমতি দিন যাতে ব্যাকগ্রাউন্ডেও রাইড রিকুয়েস্ট পান!"
  }
```

---

### Task 9: Verification & Testing

**Files:**
- Create: `tests/driver-notifications.test.ts`

**Step 1: Implement automated route tests**
Write schema verification and push token endpoint validation in `tests/driver-notifications.test.ts` to verify basic GET/POST/DELETE handling.

**Step 2: Manual End-to-End Verification**
- Set up Firebase Client env variables in `.env.local`
- Toggle status Online in driver panel and verify the native browser permission prompt displays.
- Confirm FCM token is generated successfully and upserted into `DriverPushToken` database.
- Confirm toggling status Offline successfully deletes the `DriverPushToken` database entry.
