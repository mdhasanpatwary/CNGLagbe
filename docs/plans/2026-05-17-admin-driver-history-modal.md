# Design Doc: Admin Driver History & Reviews Modal

## Goal
Implement a way for administrators to view the complete trip history, earnings statistics, and passenger reviews for any specific driver directly from the Admin Dashboard.

## Problem
Currently, administrators can only see a driver's average rating and total income in the drivers list. To investigate issues or reward good performance, they need to see individual trip records and specific passenger feedback (reviews), which is currently only accessible to the driver themselves.

## Proposed Design

### 1. User Interface
- **Entry Point**: A "History" button (using `History` or `Clock` icon) added to each driver row in the `DriversTab.tsx`.
- **Modal Component**: `DriverHistoryModal.tsx`
    - Reuses the visual language of the `DriverHistoryPage.tsx` (Driver Panel).
    - **Header**: Driver name and basic stats (Total Trips, Total Earnings, Avg Rating).
    - **Filters**: Timeframe (Today, 7 Days, 30 Days, All) and Status (All, Completed, Cancelled).
    - **Content**: A scrollable list of "Trip Cards" showing:
        - Date and time.
        - Status badge (Done/Cancelled).
        - Pickup and Destination addresses (text only, no map snapshots).
        - Fare, Platform Fee, and Distance.
        - Passenger Rating (Stars) and Feedback (Text) if available.
    - **Pagination**: Standard Next/Prev controls for browsing large histories.

### 2. Architecture & Data Flow
- **API**: Create a new GET endpoint: `/api/admin/drivers/[id]/history`.
    - Protected by `getAuthenticatedAdmin`.
    - Returns paginated booking records with user details (for reviewer names).
    - Returns aggregate stats for the header summary.
- **State Management**:
    - Handled within `useAdminDashboard.ts` hook.
    - New states: `historyDriverId` (string | null), `isHistoryModalOpen` (boolean).
- **Styling**: Consistent with the premium admin dashboard theme (slate/blue palette, rounded-2xl cards, high-contrast typography).

### 3. Translation Keys
Add the following keys to `TEXT` in `constants/text.ts`:
- `view_history`: { en: "View History", bn: "হিস্ট্রি দেখুন" }
- `driver_history`: { en: "Driver History", bn: "ড্রাইভার হিস্ট্রি" }

## Verification Plan
1. **Functional**:
    - Click "History" on a driver with trips -> Modal opens with correct data.
    - Click "History" on a driver with NO trips -> Empty state shown.
    - Apply filters -> Data refreshes correctly.
    - Click Pagination -> Next/Prev pages load correctly.
2. **Security**:
    - Ensure non-admins cannot access the `/api/admin/drivers/[id]/history` endpoint.
3. **UI/UX**:
    - Verify responsiveness on mobile/tablet viewports.
    - Confirm design consistency with the rest of the Admin Dashboard.
