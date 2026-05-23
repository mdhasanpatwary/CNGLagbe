# Design: Driver Continuous Audio Alert Notification

This design document outlines the implementation of a continuous, looped audio alert notification system in the driver dashboard when an incoming ride request is active.

## Problem Statement
Currently, when a new ride request arrives on the driver's dashboard, the system plays an audio beep tone only once (lasting 0.5 seconds). If the driver is away from their screen or in a noisy street environment, they might miss this single beep, causing ride bookings to time out without their knowledge.

## Proposed Solution
We will implement a looped audio alert mechanism that continuously plays a rhythmic beep tone every 1.5 seconds as long as an active ride request is visible in the incoming request modal. The looped alert will immediately stop under any of the following conditions:
1. The driver accepts the ride request.
2. The driver rejects the ride request.
3. The ride request times out (countdown timer reaches 0).
4. The driver navigates away from the dashboard page or log out (unmounting the page component).

## Technical Architecture

### 1. State & Interval Management
We will introduce a React `useRef` to hold the reference to the audio loop timer interval, allowing robust clearance across actions and render lifecycles.
```typescript
const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);
```

### 2. Looped Tone Triggering
Inside the `useEffect` hook that handles requests and timer checking, we will:
1. Clear any existing audio interval to avoid overlapping loops.
2. Define a clean oscillator beep function (`playAlertTone`).
3. Fire an initial beep immediately.
4. Establish a `setInterval` that fires `playAlertTone` every 1.5 seconds.

```typescript
const clearAudioInterval = () => {
  if (audioIntervalRef.current) {
    clearInterval(audioIntervalRef.current);
    audioIntervalRef.current = null;
  }
};

// ... inside the active request useEffect:
if (activeReqId !== lastActiveReqId.current) {
  lastActiveReqId.current = activeReqId;
  clearAudioInterval();

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

  playAlertTone();
  audioIntervalRef.current = setInterval(playAlertTone, 1500);
}
```

### 3. Cleanup Guard
To avoid sound leaking or orphan intervals running in the background:
- **Action Triggers (`handleAccept`, `handleReject`):** Immediately call `clearAudioInterval()` before initiating network operations.
- **Hook Cleanup:** The return function of the `useEffect` will invoke `clearAudioInterval()`.
- **Visibility & Status Changes:** If `isOnline` is toggled off or an active booking is engaged, the interval is cleared automatically.

## Verification & Testing
- Validate locally by simulating a new request arriving.
- Verify the rhythmic beep is triggered every 1.5 seconds.
- Verify clicking Accept or Reject stops the beep loop instantly.
- Verify that when the timer hits zero, the beep loop stops.
- Validate that navigating away from the page terminates any audio loop immediately.
