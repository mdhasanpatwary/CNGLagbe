"use client";

import { useEffect, useState } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";
import { apiFetch } from "@/utils/api";
import { toast } from "sonner";

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

  const initMessaging = (): Messaging | null => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return null;
    }
    const missingKeys = [];
    if (!firebaseConfig.apiKey) missingKeys.push("NEXT_PUBLIC_FIREBASE_API_KEY");
    if (!firebaseConfig.authDomain) missingKeys.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
    if (!firebaseConfig.projectId) missingKeys.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
    if (!firebaseConfig.storageBucket) missingKeys.push("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
    if (!firebaseConfig.messagingSenderId) missingKeys.push("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
    if (!firebaseConfig.appId) missingKeys.push("NEXT_PUBLIC_FIREBASE_APP_ID");

    if (missingKeys.length > 0) {
      console.warn("Firebase client configuration is incomplete. Missing environment variables:", missingKeys);
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

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPermission(Notification.permission);
      if (Notification.permission === "granted") {
        initMessaging();
      }
    }
  }, []);

  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Foreground push notification received:", payload);
      // Display localized toast notification
      toast.success(payload.notification?.title || "নতুন রাইড রিকুয়েস্ট! 🛺", {
        description: payload.notification?.body || "ভাড়া এবং দূরত্বের বিবরণ দেখতে ক্লিক করুন",
        duration: 10000,
      });
    });

    return () => unsubscribe();
  }, [messaging]);

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

      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        console.warn("FCM registration skipped: NEXT_PUBLIC_FIREBASE_VAPID_KEY is not defined in environment variables. Please generate a VAPID key in the Firebase Console (Project Settings -> Cloud Messaging -> Web Push Certificates).");
        return false;
      }

      // Register or find service worker
      const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

      let token: string | null = null;
      try {
        const tokenPromise = getToken(activeMessaging, {
          vapidKey,
          serviceWorkerRegistration: reg,
        });

        // 15-second timeout — FCM needs time for SW activation + push subscription + token fetch
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("FCM token request timed out (15s)")), 15000)
        );

        token = await Promise.race([tokenPromise, timeoutPromise]);
      } catch (tokenError) {
        // Never fall back to mock tokens — they cause Firebase Admin SDK to reject with 'invalid-argument'
        console.error("FCM getToken failed:", tokenError);
        console.warn(
          "Push notifications will NOT work for this driver session. " +
          "Ensure: (1) browser supports notifications, (2) VAPID key matches Firebase Console, " +
          "(3) site is served over HTTPS or standard localhost."
        );
        return false;
      }

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
