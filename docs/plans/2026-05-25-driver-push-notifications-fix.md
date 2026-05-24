# Driver Push Notifications Fix Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Resolve the driver background push notification failure by removing the Service Worker scope restriction and implementing a high-visibility foreground message handler with toast alerts.

**Architecture:** Remove `{ scope: "/firebase-cloud-messaging-push-scope" }` from `navigator.serviceWorker.register` in `useDriverFCM.ts` to default to root `/` scope. Wire Firebase Client SDK's `onMessage` in the same hook to show localized `sonner` toasts when the app is active in the foreground.

**Tech Stack:** Next.js (App Router), React, Firebase Client Web SDK, Sonner Toast.

---

### Task 1: Remove Service Worker Scope Restriction

**Files:**
- Modify: `hooks/useDriverFCM.ts`

**Step 1: Check existing registration code**
Verify lines 78-81 in `hooks/useDriverFCM.ts` which specify the scope option.

**Step 2: Modify the Service Worker registration call**
Update `hooks/useDriverFCM.ts` to register the service worker without the scope parameter, allowing it to default to the root `/` scope:
```typescript
      // Register or find service worker
      const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
```

**Step 3: Run typescript linter to verify no syntax/type errors**
Run: `npx tsc --noEmit`
Expected: Compilation passes.

**Step 4: Commit instructions**
*(Note: As per project rules, automatic commits are forbidden. The agent will prepare the staging status but wait for user approval).*
Run: `git diff hooks/useDriverFCM.ts`
Expected: Correct diff showing removal of the scope parameter.

---

### Task 2: Implement Foreground Message Handler (`onMessage`)

**Files:**
- Modify: `hooks/useDriverFCM.ts`

**Step 1: Import onMessage and toast**
Add the `onMessage` import from `"firebase/messaging"` and `toast` from `"sonner"`:
```typescript
import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";
import { toast } from "sonner";
```

**Step 2: Set up foreground listener inside a useEffect**
We will add a `useEffect` inside `useDriverFCM.ts` to listen for incoming foreground messages whenever the `messaging` state is initialized:
```typescript
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
```

**Step 3: Verify typescript compilation**
Run: `npx tsc --noEmit`
Expected: Passes without errors.

---

### Task 3: E2E and Manual Verification

**Files:**
- Modify: None

**Step 1: Verify TypeScript & Build**
Run: `npm run build` (or `npx tsc --noEmit` only if full build is not requested by the user, keeping in mind lightweight rules).
Expected: 0 errors.

**Step 2: Verify in the Browser**
Use the browser subagent to:
1. Log in to `http://driver.localhost:3000/dashboard` with phone `01711111111` and password `driver123`.
2. Toggle Online and accept notifications permission.
3. Verify that the Service Worker is registered on root scope `/` using DevTools or inspecting `/api/sync` state.
4. Confirm no errors are present in the console.
