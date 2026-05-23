# Design Document: Mute Alert Sound Button on Driver Dashboard

## Goal
Add a premium Mute/Unmute button to the incoming ride request fullscreen modal on the Driver Dashboard. This allows drivers to silence the rhythmic alert tone for the current request.

## Core Ruleset Compliance
*   **Evaluate Features:** A mute toggle does not shift CNGLagbe toward a full ride-sharing platform; it is a standard driver comfort/accessibility enhancement for notification sounds.
*   **Icon Labels:** The toggle button contains both icons (`Volume2`/`VolumeX`) and explicit text labels ("Mute"/"Unmute" or Bengali equivalent) for low-literacy drivers.
*   **Simple Language:** Action labels use simple terms: `Mute` / `Unmute` (`মিউট` / `আনমিউট`).
*   **State Reset:** The mute status resets (automatically unmutes) when a new request arrives, ensuring subsequent alerts are not missed.
*   **Logic/UI Separation:** The state variables and reference management are integrated seamlessly inside the main page component and hooks.

## Proposed Design
### 1. Translation Keys (`constants/text.ts`)
Add key definitions to support dynamic localization:
*   `mute`: `{ en: "Mute", bn: "মিউট" }`
*   `unmute`: `{ en: "Unmute", bn: "আনমিউট" }`

### 2. State & Sync Ref Pattern (`app/driver/dashboard/page.tsx`)
*   **State:** `const [isMuted, setIsMuted] = useState(false);`
*   **Ref:** `const isMutedRef = useRef(isMuted);`
*   **Sync Effect:** Syncs the state to the ref without triggering interval tear-downs.
*   **Sound Interceptor:** Inside `playAlertTone`, return early if `isMutedRef.current` is true.
*   **Reset Logic:** Reset `isMuted` and `isMutedRef.current` to `false` when a new request ID is detected.

### 3. UI Placement
The button is added to the incoming request modal's premium gradient header next to the countdown badge. It uses a high-contrast transition-enabled layout:
*   **Active (Sound On):** Slate background with slate text.
*   **Muted (Sound Off):** Soft red background with red text and warning pulse animation.

## Verification Plan
1.  **Audio Alert Loop:** Verify rhythmic play behavior starts normally on incoming request.
2.  **Mute Event:** Verify clicking Mute stops the sound instantly.
3.  **Unmute Event:** Verify clicking Unmute resumes the rhythmic sound loop.
4.  **Auto-Reset:** Verify that when a request times out/is rejected and a new one arrives, the state is unmuted by default.
