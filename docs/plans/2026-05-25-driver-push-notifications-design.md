# 2026-05-25 Driver Push Notifications Fix Design

## Goal
Resolve the issue preventing drivers from receiving background push notifications when their dashboard browser tab is inactive/minimized, and implement beautiful foreground in-app alerts when the tab is active.

## Identified Issues
1. **Service Worker Scope Restriction**: The FCM service worker `firebase-messaging-sw.js` is registered with `{ scope: "/firebase-cloud-messaging-push-scope" }`. This prevents the service worker from controlling pages outside this scope, which includes the active driver dashboard served at `/dashboard` (or subdomains like `driver.localhost:3000/dashboard`).
2. **Missing Foreground Message Listener**: Under the FCM SDK specifications, when the web app is active in the foreground, background notifications are not displayed natively by the browser. A foreground message listener (`onMessage` handler) is required on the client side to intercept incoming messages and trigger in-app UI.

## Proposed Architecture

```mermaid
graph TD
    subgraph Client-Side (Driver Dashboard)
        DH[Dashboard Page / Hooks] -->|Mount / Online Status| FCM[useDriverFCM Hook]
        FCM -->|1. Register SW root scope /| SW[firebase-messaging-sw.js]
        FCM -->|2. Register Foreground onMessage| Toast[sonner toast Alert]
    end
    subgraph Service Worker (Background)
        SW -->|3. onBackgroundMessage| Native[OS Native Push Notification]
    end
```

### 1. Client-Side Service Worker Scope Standardisation
We will register `/firebase-messaging-sw.js` without the restricted scope options parameter. It will default to the root `/` scope, ensuring it controls the driver dashboard domain and subdomains perfectly.

### 2. Foreground Message Listener (`onMessage`)
We will import and initialize `onMessage` inside `useDriverFCM.ts` and attach a listener to the active Firebase Messaging instance. When a foreground message is received:
- Play the continuous rhythmic alert tone.
- Display a high-visibility, localized in-app `sonner` toast notification using translation strings.

---

## Technical Specifications

### Scoped Files to Modify

#### 1. `hooks/useDriverFCM.ts`
- Modify the `registerToken` function to remove the `{ scope: "/firebase-cloud-messaging-push-scope" }` options parameter when calling `navigator.serviceWorker.register(...)`.
- Add a React `useEffect` to subscribe to foreground messages via `onMessage` using the initialized Firebase `Messaging` instance.
- Ensure proper type-safe imports for `onMessage` and `toast`.

#### 2. `constants/text.ts`
- Verify or add translation strings for foreground push notifications if needed.

---

## Verification Plan

### Automated Verification
- Run typescript compilation `npx tsc --noEmit` to verify code type safety.

### Manual Verification via Browser Subagent
1. Navigate to the Driver Dashboard page and log in.
2. Toggle Online and grant notification permissions.
3. Validate that the service worker is registered with the root scope `/` (observable in browser console / devtools).
4. Minimize the browser tab or switch to a blank tab.
5. Trigger a simulated FCM notification via `test-push.ts` or database updates and verify that a native background notification is displayed.
6. Return to the driver tab and verify that active ride requests are handled correctly in the foreground.
