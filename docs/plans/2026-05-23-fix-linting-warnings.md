# Fix Remaining Linting Warning (Native Button refactor) Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Resolve the last remaining ESLint warning by refactoring the native HTML `<button>` in `app/driver/dashboard/page.tsx` (used for mute/unmute toggle) to use the project's standardized `AppButton` component.

**Architecture:** Refactor the native `<button>` element on lines 1210-1229 of `app/driver/dashboard/page.tsx` into a styled `<AppButton variant="ghost">` component. This preserves the existing aesthetics and behavior while adhering to the design system rule.

**Tech Stack:** Next.js, React, TailwindCSS, ESLint, TypeScript.

---

## Proposed Changes

### CNGLagbe Frontend

---

#### [MODIFY] [page.tsx](file:///Users/patwary/Projects/CNGLagbe/app/driver/dashboard/page.tsx)

- Update the `<button>` element at lines 1210-1229 of `/Users/patwary/Projects/CNGLagbe/app/driver/dashboard/page.tsx` to `<AppButton variant="ghost">`.
- Apply custom height overrides (`h-auto`) and style preservation rules in the `className` prop to ensure the button looks exactly as before.

## Verification Plan

### Automated Tests
- Run ESLint to verify zero warnings or errors:
  ```bash
  npm run lint
  ```
- Run TypeScript compiler check to verify type safety:
  ```bash
  npx tsc --noEmit
  ```
- Run the Jest test suite to ensure all unit tests pass:
  ```bash
  npx jest --passWithNoTests
  ```
