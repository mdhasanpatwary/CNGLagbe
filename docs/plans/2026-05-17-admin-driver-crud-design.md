# Design Doc: Admin Driver CRUD, Search, and Pagination

**Date:** 2026-05-17
**Status:** Approved

## Goal
Implement full management capabilities for drivers in the Admin Panel, including adding new drivers with documents, editing existing ones, hard deleting drivers, searching by name/phone, and paginating the driver list.

## Proposed Changes

### Backend (API)

#### 1. [MODIFY] `app/api/admin/drivers/route.ts`
- Update `GET` to support `search` query parameter.
- Implement `POST` to create a new driver.
- Ensure only authenticated admins can perform these actions.

#### 2. [NEW] `app/api/admin/drivers/[id]/route.ts`
- Implement `PATCH` to update a specific driver.
- Implement `DELETE` to hard delete a driver.

### Frontend (Admin Panel)

#### 3. [MODIFY] `app/admin/AdminDashboard.tsx`
- Add a search input field in the "Drivers" tab.
- Implement server-side pagination for the drivers table.
- Implement a multi-step modal for "Add Driver" (4 steps: Basic, NID, Vehicle, License).
- Implement an "Edit Driver" modal (reusing the Add Driver modal logic).
- Implement a delete confirmation flow.
- Add "Edit" and "Delete" buttons to each driver row.

#### 4. [MODIFY] `constants/text.ts`
- Add translation keys for Search, Add/Edit Driver steps, and delete confirmation.

## Technical Details
- **Validation**: Use Zod schemas for driver creation and updates.
- **File Upload**: Reuse Supabase storage logic for document and photo uploads.
- **State Management**: Use `react-hook-form` for the complex multi-step form.
- **Search Logic**: Use `contains` with `mode: 'insensitive'` in Prisma for name and phone search.
- **Hard Delete**: Prisma will delete the driver record. Note: This will fail if there are dependent records (like bookings) unless cascading is set up, but the plan is to follow the user's "Hard Delete" request.

## Verification Plan
- Manually test adding a driver with all documents.
- Test searching for a driver by name.
- Test pagination by changing pages.
- Test editing a driver's phone number.
- Test deleting a driver and verifying they are removed from the database.
