# Mute Alert Sound Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Add a premium Mute/Unmute toggle button to the driver dashboard incoming request modal, allowing drivers to silence alert tones dynamically.

**Architecture:** Utilize React `useState` for tracking the active mute state and a synchronized React `useRef` for thread-safe access inside the Web Audio API interval callback. Automatically reset the mute state to active on new incoming bookings.

**Tech Stack:** React (hooks), Tailwind CSS, Lucide icons, Next.js.

---

### Task 1: Add Localization Translation Keys

**Files:**
- Modify: `constants/text.ts:210-230`

**Step 1: Write the updated translation keys**
Insert the new keys `mute` and `unmute` inside the global `TEXT` dictionary.

```typescript
  mute: { en: "Mute", bn: "মিউট" },
  unmute: { en: "Unmute", bn: "আনমিউট" },
```

**Step 2: Run verification**
Run the typescript compiler to ensure there are no syntax errors in the translation file.
Run: `npm run build` or similar compilation checks (or typecheck).

---

### Task 2: Implement Mute State and Synchronization Ref in Driver Home Page

**Files:**
- Modify: `app/driver/dashboard/page.tsx:60-90` (State declarations area)

**Step 1: Declare state and ref**
Add the React state and `useRef` to track `isMuted` and keep the ref in sync so that the non-reactive setInterval loop can inspect the value.

```typescript
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);
```

**Step 2: Add auto-reset logic on new request**
Inside the request timer/alert `useEffect` (around line 554), reset `isMuted` and its ref to `false` when a new request is detected.

```typescript
    // Only reset timer and play sound if it's a NEW request
    if (activeReqId !== lastActiveReqId.current) {
      lastActiveReqId.current = activeReqId;
      setIsMuted(false);
      isMutedRef.current = false;
      ...
```

---

### Task 3: Intercept Audio Generation in alert loop

**Files:**
- Modify: `app/driver/dashboard/page.tsx:568-588` (Inside `playAlertTone` function declaration)

**Step 1: Add sound playback interceptor**
Update `playAlertTone` inside the `useEffect` to return early if `isMutedRef.current` is true.

```typescript
      const playAlertTone = () => {
        if (isMutedRef.current) return;
        try {
          const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          if (!AudioCtx) return;
          ...
```

---

### Task 4: Integrate Premium Mute Toggle Button in Modal Header

**Files:**
- Modify: `app/driver/dashboard/page.tsx:1178-1196` (Incoming Request Fullscreen Modal Header)

**Step 1: Update Header layout and add toggle button**
Replace the gradient header's right container with a flex layout containing the interactive mute toggle button (with icon and low-literacy label) and the timer badge.

```tsx
                {/* Premium Gradient Header */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 shrink-0 flex justify-between items-center text-white border-b border-slate-800">
                  <div className="flex items-center gap-2.5 relative">
                    <span className="w-3.5 h-3.5 bg-primary rounded-full animate-ping absolute" />
                    <span className="w-3.5 h-3.5 bg-primary rounded-full animate-pulse shadow-[0_0_12px_rgba(22,163,74,0.6)] relative" />
                    <h3 className="text-xs font-black uppercase tracking-widest ml-1">{t("incoming")}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className={`font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-300 ${
                        isMuted
                          ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                          : "bg-slate-800/80 text-slate-300 border-slate-700/50 hover:bg-slate-700 hover:text-white"
                      }`}
                    >
                      {isMuted ? (
                        <>
                          <VolumeX size={14} className="animate-pulse" />
                          <span>{t("unmute")}</span>
                        </>
                      ) : (
                        <>
                          <Volume2 size={14} />
                          <span>{t("mute")}</span>
                        </>
                      )}
                    </button>
                    <Badge 
                      className={`font-black flex gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-300 ${
                        isUrgent 
                          ? "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse hover:bg-red-500/20" 
                          : "bg-slate-800/80 text-emerald-400 border-emerald-500/20 hover:bg-slate-800"
                      }`}
                    >
                      <Clock size={14} className={isUrgent ? "animate-pulse" : ""} /> 
                      <span>{timeLeft}s</span>
                    </Badge>
                  </div>
                </div>
```

**Step 2: Ensure icons imports exist**
Make sure `Volume2` and `VolumeX` are imported from `"lucide-react"` at the top of the file.

---

### Task 5: Manual Verification and Compilation

**Step 1: Lint and typecheck check**
Run standard lint or typecheck command to verify correctness of imports and TS safety.
Run: `npm run build` or local test runners.
