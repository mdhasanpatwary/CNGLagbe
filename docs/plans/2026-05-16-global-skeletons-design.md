# Design Document: Global Skeleton Loading System

**Date:** 2026-05-16
**Status:** Approved
**Topic:** Reusable Skeleton Components for CNGLagbe

## 1. Problem Statement
Currently, skeleton loading states are fragmented. Some pages use full-screen spinners, others define local skeletons, and some have no loading states at all. This leads to code duplication, inconsistent UX, and layout shifting.

## 2. Goals
- **Zero Duplication**: One source of truth for all loading patterns.
- **Zero Layout Shift**: Skeletons must exactly match the dimensions and spacing of the final UI cards.
- **Premium UX**: Consistent pulse animation and standardized shapes.
- **Ease of Use**: Developers should be able to drop in a single component (e.g., `<HistoryListSkeleton />`) to handle complex loading states.

## 3. Proposed Architecture

### 3.1. Primitives (Enhanced `Skeleton`)
Update `components/ui/skeleton.tsx` to include standardized shape components:
- `SkeletonCircle`: For status dots and avatars.
- `SkeletonLine`: For text lines with variable widths.
- `SkeletonBlock`: For main card containers.

### 3.2. Patterns Library (`AppSkeletons`)
A new file `components/ui/AppSkeletons.tsx` will house pre-composed layouts:
- **`HistoryListSkeleton`**: Replaces local skeletons in history pages.
- **`StatsGridSkeleton`**: For dashboard info cards.
- **`ActiveBookingSkeleton`**: For the ongoing ride banner.
- **`DashboardSkeleton`**: A full-page layout for home screens.

## 4. Implementation Strategy
1. **Refactor Base Component**: Add shape helpers to the existing shadcn/ui Skeleton.
2. **Create Patterns**: Implement the 4 major patterns identified.
3. **Global Replacement**:
   - `app/user/page.tsx`: Replace spinner with `DashboardSkeleton`.
   - `app/driver/dashboard/page.tsx`: Replace spinner with `DashboardSkeleton`.
   - `app/user/history/page.tsx`: Remove local skeleton, use `HistoryListSkeleton`.
   - `app/driver/history/page.tsx`: Use `HistoryListSkeleton`.
4. **Validation**: Verify that dimensions match exactly across all breakpoints.

## 5. Success Criteria
- [ ] No local `Skeleton` definitions outside of the central library.
- [ ] No "jumping" UI when switching from loading to data states.
- [ ] 100% adherence to design tokens (`rounded-2xl`, `gap-3`, etc.).
