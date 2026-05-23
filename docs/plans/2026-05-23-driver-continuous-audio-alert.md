# Driver Continuous Audio Alert Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement a looped, continuous rhythmic audio alert notification (beeping every 1.5 seconds) in the driver dashboard when an incoming ride request is active, and ensure it stops immediately when accepted, rejected, timed out, or when navigating away.

**Architecture:** We will manage the interval using a React `useRef` variable in `app/driver/dashboard/page.tsx`. The interval will be cleared on component unmount, active state transitions, or click events on accept/reject buttons.

**Tech Stack:** Next.js (App Router), React, Lucide React, Web Audio API (`AudioContext`).

---

### Task 1: Setup Audio Interval Reference and Cleanup Helper in Driver Dashboard

**Files:**
- Modify: `app/driver/dashboard/page.tsx`

**Step 1: Declare the `useRef` for the interval and add a helper function to clear the interval safely.**

Inside `DriverHomePage` component, declare the ref:
```typescript
const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);
```

Then define a helper function `clearAudioInterval`:
```typescript
const clearAudioInterval = useCallback(() => {
  if (audioIntervalRef.current) {
    clearInterval(audioIntervalRef.current);
    audioIntervalRef.current = null;
  }
}, []);
```

**Step 2: Add `clearAudioInterval()` to existing unmount and status reset lifecycles.**

In the geolocation tracking cleanup `clearLocationTimers` and other general cleanups, ensure we also invoke `clearAudioInterval()`. Specifically, inside the component's main unmount `useEffect`, ensure we clear the audio interval.

```typescript
useEffect(() => {
  // ... existing code ...
  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    clearLocationTimers();
    clearAudioInterval(); // Clear audio on unmount
  };
}, [clearLocationTimers, clearAudioInterval, ...]);
```

**Step 3: Verify build compiles cleanly**

Run: `npm run build` or `yarn lint`
Expected: Passes without errors.

---

### Task 2: Implement Rhythmic Looped Tone Triggering in Request Effect

**Files:**
- Modify: `app/driver/dashboard/page.tsx`

**Step 1: Update the Request Effect to trigger a looped interval instead of playing the tone once.**

In `app/driver/dashboard/page.tsx` inside the incoming request `useEffect` (around line 530), replace the single play call with an interval.

```typescript
    // Only reset timer and play sound if it's a NEW request
    if (activeReqId !== lastActiveReqId.current) {
      lastActiveReqId.current = activeReqId;
      
      // Calculate how much time is actually left based on createdAt
      const createdAt = new Date(activeReq.createdAt).getTime();
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - createdAt) / 1000);
      const maxTimeoutSeconds = syncData?.timeoutSeconds ?? 300;
      const initialTimeLeft = Math.max(0, maxTimeoutSeconds - elapsedSeconds);
      
      setTimeLeft(initialTimeLeft);

      // Play alert tone helper
      const playAlertTone = () => {
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (!AudioCtx) return;
          const audioCtx = new AudioCtx();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);
          gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
          oscillator.start();
          oscillator.stop(audioCtx.currentTime + 0.5);
        } catch (e) {
          console.error(e);
        }
      };
      
      // Clear any existing alert tone loops
      clearAudioInterval();
      
      // Play immediately
      playAlertTone();
      
      // Set up loop interval for 1.5 seconds (1500 ms)
      audioIntervalRef.current = setInterval(playAlertTone, 1500);
    }
```

Make sure that in the `useEffect` cleanup return, we also clear the interval:
```typescript
    return () => {
      clearInterval(interval);
      clearAudioInterval(); // Stop loop on request change/dismissal
    };
```

**Step 2: Verify build compiles cleanly**

Run: `yarn lint`
Expected: Passes without errors.

---

### Task 3: Stop Audio Alert Instantly on Accept, Reject, or Offline Actions

**Files:**
- Modify: `app/driver/dashboard/page.tsx`

**Step 1: Stop sound loop in driver action handlers.**

In the `handleAccept`, `handleReject`, and `toggleOnline` handlers, immediately call `clearAudioInterval()`.

In `handleReject`:
```typescript
  const handleReject = useCallback(async (id: string) => {
    clearAudioInterval();
    setRejectedIds(prev => new Set(prev).add(id));
    // ... existing api Fetch and toast ...
  }, [t, clearAudioInterval]);
```

In `handleAccept`:
```typescript
  const handleAccept = useCallback(async (req: Booking) => {
    clearAudioInterval();
    try {
      // ... existing api fetch ...
  }, [t, queryClient, clearAudioInterval]);
```

In `toggleOnline`:
```typescript
  const toggleOnline = async () => {
    clearAudioInterval();
    try {
      // ... existing toggle logic ...
  };
```

**Step 2: Stop sound loop in low balance suspension or forced offline.**

In `FORCED_OFFLINE` listener and other offline edge cases, ensure `clearAudioInterval()` is invoked.

**Step 3: Verify the full build and run linter**

Run: `yarn lint`
Expected: Finished with 0 errors.

---

### Task 4: Manual Verification in Browser

**Manual Verification Steps:**
1. Log in as a driver, go Online on the dashboard.
2. Simulate/create a new passenger booking request for this driver.
3. Observe that the modal pops up and the beep tone plays immediately, then repeats every 1.5 seconds.
4. Let the request time out or click "Reject" — verify that the beep loop immediately ceases.
5. Simulate another request, click "Accept" — verify that the beep loop immediately ceases.
6. Verify that no background loops are left running.
