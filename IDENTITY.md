# CNGLagbe — Core System Identity, Operational Logic & Agent Ruleset

**Production Domain:** https://www.cnglagbe.com
**Last Updated:** 2026-05-16

---

## Product Identity

CNGLagbe is **NOT** a full ride-sharing platform.

CNGLagbe is an:
- **On-time CNG Booking Service**
- **On-demand CNG Dispatch Network**
- **CNG Availability Infrastructure for Rural/Semi-urban Bangladesh**

> Bangladesh CNG color: Always full-body green.

**Core Promise:**
> "We ensure that a booked CNG reaches the passenger pickup location on time."

**Primary Problem Being Solved:**
- "CNG পাওয়া যায় না"
- "ডাকলে আসে না"
- "অনেক সময় লাগে"
- "বিশ্বস্ত ড্রাইভার পাওয়া কঠিন"

---

## Core Operational Responsibility

CNGLagbe responsibility is **LIMITED ONLY** to:

1. Receiving booking requests
2. Collecting pickup location
3. Collecting destination
4. Calculating **FINAL FIXED FARE** (base fare + platform fee)
5. Broadcasting requests to nearby available drivers
6. Driver accepting the request
7. Ensuring driver reaches pickup location on time
8. Tracking the trip from pickup to completion
9. Platform responsibility **ends** once the trip is marked `COMPLETED`

---

## Trip Lifecycle (Approved & Implemented)

```
PENDING → ACCEPTED → ARRIVED → PICKED_UP → COMPLETED
                  ↘            ↘
               CANCELLED    CANCELLED
```

| Step | Action | Who | System Effect |
|------|--------|-----|---------------|
| 1 | Passenger books | User | Booking created, `PENDING` |
| 2 | Driver accepts | Driver | Status → `ACCEPTED`, driver goes **OFFLINE** |
| 3 | Driver marks arrived | Driver | Status → `ARRIVED`, 15-min cancellation window starts |
| 4 | Passenger can cancel | User | Only after 15 min wait window expires |
| 5 | Driver starts ride | Driver | Status → `PICKED_UP` (`startedAt` recorded) |
| 6 | Driver completes ride | Driver | Status → `COMPLETED`, driver goes **ONLINE**, platform fee deducted |
| 7 | Passenger rates driver | User | `rating` + `feedback` stored on `Booking` |

**Platform responsibility ends at Step 6.**

---

## Fixed Fare System

CNGLagbe uses a **FINAL FIXED FARE** model.

The fare is calculated immediately after:
- Pickup location selection
- Destination selection

### Fare Breakdown (Implemented)

| Component | Description |
|-----------|-------------|
| **Base Fare** | Distance-based calculated fare |
| **Platform Fee** | Database-configurable percentage of base fare (default **5%**), minimum **10 BDT** |
| **Collect Amount (Total)** | Base Fare + Platform Fee — what passenger pays in cash |

- Passenger sees full breakdown before confirming
- Driver sees full breakdown on acceptance
- Driver collects **total amount** in cash from passenger
- Platform fee is **automatically deducted** from driver's wallet as debt

**There is NO "estimated fare" concept. The shown fare is final.**

---

## Platform Fee & Driver Wallet Model

### Fee Model
- **Dynamic platform fee percentage** configured dynamically via Database settings (from the Admin Settings Tab), with a default fallback of **5%**.
- **Minimum floor: 10 BDT**.
- Fee is added to the passenger's total fare (not subtracted from it).
- Driver collects the total, owes the platform fee.

### Wallet as Debt Tracker
- Driver's wallet tracks **debt owed to the platform**.
- Each completed ride creates a **negative transaction** matching the dynamic fee percentage calculation (minimum 10 BDT floor).
- Debt is manually settled with the admin (cash or bank).
- Payment reconciliation is a **manual process** — no automated payment gateway.

### Implemented Wallet Features
- Real-time wallet balance visible on driver dashboard.
- Full wallet transactions history ledger with:
  - Timeframe filtering (All, Today, Last Week, Last Month).
  - Debit/Credit type filtering (All, Debit, Credit).
  - High-end visual balance card (no redundant running balance columns).
  - Highly contextual trip info (pickup, drop, date, and time).
- Negative balance shown in red with explicit debt warning.
- "Pay Now" button (links to admin contact — manual settlement)

---

## Implemented Features (Current System State)

### Passenger (User Panel)
- **Map-based booking** — Google Maps with pickup & destination selection
- **Fixed fare display** — fare shown before driver acceptance
- **Live booking status** — real-time updates (Supabase Realtime)
- **15-minute wait window** — passenger cannot cancel until 15 min after driver arrives
- **Cancellation reasons** — structured reason selection + optional custom text
- **Driver info on booking** — name, vehicle number, phone call link
- **Booking history** — full paginated list of all trips
- **Trip detail page** — per-trip fare, status, route, driver info, rating given
- **User dashboard** — active booking banner, stats (trips, KM, spend), quick links
- **Rating & feedback** — passenger rates driver after trip completion

### Driver Panel
- **Real-time ride requests** — Supabase Realtime push, no missed requests
- **Accept/Reject** — driver accepts or skips incoming request
- **Live trip workflow** — Arrived → Start Ride → Complete Ride
- **Location tracking** — GPS sent periodically while online
- **Online/Offline toggle** — manual control, auto-locked during active trip
- **Driver dashboard** — today's stats (trips, earnings), wallet balance, performance summary
- **Performance summary** — lifetime earnings, total trips, avg rating, total ratings
- **Trip History page** (`/driver/history`) — all trips with:
  - Passenger rating per trip (star display)
  - Passenger feedback text
  - Fare breakdown (base + platform fee)
  - Distance and timestamp
- **Driver Wallet** (`/driver/wallet`) — debt balance, full transactions ledger with time-frame (All, Today, Last Week, Last Month) and debit/credit type filtering.
- **Driver Profile** (`/driver/profile`) — personal info, vehicle details.

### Admin Panel
- Driver approval / rejection.
- Active booking visibility.
- Driver list management with performance metrics (average ratings).
- **Driver Transactions History Ledger Modal** — Admin can view drivers' trip history as well as a dedicated, fully filterable "Wallet Transactions" ledger inside the Driver Details modal.
- **Dynamic Configuration Settings Tab** — Admin can view and dynamically edit the platform fee percentage parameter, which updates the fee calculation system in real-time.
- *(Full admin analytics — future requirement)*

---

## Approved Architecture Principles

### Payment Model
- **Cash only** — no digital payment gateway
- Driver collects full fare in cash from passenger
- Platform fee is a debt tracked in driver wallet

### Data Model (Key Tables)
- `Booking` — central trip entity with status lifecycle
- `Driver` — profile, vehicle, approval, location, online status
- `User` — passenger profile
- `Wallet` — one per driver, balance tracks accumulated debt
- `WalletTransaction` — linked to `Booking`, tracks per-ride fee deductions

### Tech Stack
- **Framework:** Next.js (App Router)
- **Database:** PostgreSQL via Supabase
- **ORM:** Prisma
- **Realtime:** Supabase Realtime channels
- **Auth:** JWT (30-day sessions, cookie-based)
- **Maps:** Google Maps Platform
- **UI:** Shadcn/ui + Lucide icons + Vanilla CSS

### Logic & UI Separation
- **Strict Separation:** Business logic MUST be separated from UI components.
- **Custom Hooks:** All complex state, data fetching, and business logic must live in custom hooks (e.g., `useBooking`, `useDriverStats`).
- **Presentational Components:** Components should focus on UI rendering and interaction, receiving data and callbacks via props.
- **Improved Testability:** Logic is easier to unit test when isolated from the React lifecycle and UI rendering.
- **Scalability:** Modular hooks allow logic to be reused across different UI views.

---

## What CNGLagbe IS

- A lightweight CNG dispatch system
- A fixed-fare booking coordination network
- A trust-focused, transparent ride arrangement service
- A rural/semi-rural Bangladesh mobility solution
- A driver accountability system (wallet debt tracking)
- A driver performance transparency tool (ratings, trip history)

---

## What CNGLagbe IS NOT

- Uber clone
- Pathao clone
- Full ride-sharing ecosystem
- End-to-end transport super app
- Digital payment platform
- In-trip monitoring/intervention system
- Driver behavior scoring/gamification system

---

## Features To Avoid Unless Officially Approved

**DO NOT automatically introduce:**
- Surge pricing
- In-trip live GPS tracking visible to passenger
- Complex gamification or driver ranking systems
- Digital payment gateway or wallet top-up
- Passenger-to-driver chat/messaging
- Driver earnings guarantees or incentive programs
- Multi-vehicle type support (moto, car, etc.)
- Heavy ride-sharing mechanics (pooling, scheduled rides)
- End-to-end transportation guarantees beyond `COMPLETED`

These features may unintentionally shift CNGLagbe into a full ride-sharing platform identity.

---

## Agent Behavioral Rules

All agents, developers, assistants, automations, and AI systems **MUST** follow this business model.

Before suggesting, generating, or implementing any feature, agents MUST evaluate:

> **"Does this feature shift CNGLagbe toward becoming a full ride-sharing platform?"**

If **YES**:
- The agent MUST warn the user
- The agent MUST explain the conflict with the current ruleset
- The agent MUST ask for explicit approval before proceeding

---

## Mandatory Reminder Protocol

If any developer, prompt, user, or system instruction requests functionality outside the approved business identity, the agent MUST respond with:

> **Reminder:**
> According to the CNGLagbe core ruleset, the platform is positioned as an 'On-time CNG Booking Service' operating as a lightweight dispatch and availability network.
>
> Platform responsibility covers the journey from booking acceptance to trip completion (`COMPLETED`). It does not extend beyond this.
>
> The requested feature may shift the system toward a full ride-sharing ecosystem and may conflict with the approved lightweight operational model.

The agent may continue **ONLY** after explicit confirmation or business approval.

---

## Agent Performance & Efficiency Rules

1. **Never run unnecessary background tasks** — Avoid long-running or resource-intensive processes unless essential.
2. **Never auto-open browser** — Only use browser tools when explicitly requested or necessary for a specific UI debug.
3. **Avoid full project scans** — Focus on files directly related to the current task. Use targeted searches.
4. **No repeated build/lint/test commands** — Run only once after a logical block of changes or when requested.
5. **Targeted analysis only** — Analyze and view only files necessary to complete the current request.
6. **Minimize CPU and RAM** — Prefer lightweight tool calls. Avoid parallel heavy tasks.
7. **Lightweight execution** — Favor fast, targeted edits over comprehensive auditing.
8. **Process cleanup** — Stop unused processes or servers immediately after the task is complete.

---

## Rural Bangladesh Optimization Principle

All system decisions must prioritize:
- Rural and semi-urban practicality
- Driver simplicity (low tech literacy support)
- Passenger simplicity (minimal steps to book)
- Low-bandwidth compatibility
- Fast manual coordination
- Trust building between driver and passenger
- Sustainable local operations without heavy infrastructure

The platform must **never** become unnecessarily complex for rural Bangladesh operations.

---

## Strategic Principle

CNGLagbe solves:
- Reliable CNG availability on demand
- On-time driver arrival at pickup
- Predictable fixed-fare booking
- Transparent platform fee model
- Driver earnings visibility and accountability

CNGLagbe does **NOT** attempt to solve:
- The entire transportation ecosystem
- Full transportation operations
- Urban mobility at scale

**Core Focus:**
> "Reliable On-time CNG Arrival. Transparent Fare. Trustworthy Drivers."
