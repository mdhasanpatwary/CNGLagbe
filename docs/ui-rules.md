# UI Consistency Rules

To maintain a premium, rural-friendly, and uniform experience, all UI development for CNGLagbe must follow this checklist.

## Core Principles
1. **No Hardcoded Colors**: Always use Tailwind theme variables (e.g., `primary`, `success`, `error`, `slate-500`). Avoid HEX or RGB codes in component styles.
2. **No Inline Spacing**: Do not use ad-hoc `margin` or `padding` in pixels. Use design tokens (`p-4`, `gap-5`, `mt-8`).
3. **No Hardcoded Text**: All user-facing text must reside in `/constants/text.ts` and be accessed via the `t()` function.
4. **Mandatory Component Usage**: Never use a raw `div` for standard blocks. Use standardized components.
5. **Mobile-First Responsiveness**: All layouts must be optimized for mobile screens first.
6. **Icon Labels**: All icons must have accompanying text labels for low-literacy accessibility.

## Simple Language Rules
1. **Word Limit**: Max 2–3 words per label/button.
2. **No Jargon**: Avoid "Method", "Duration", "Estimated", "Revenue", "Dashboard". Use "Cash", "Time", "Price", "Income", "Home".
3. **Conversational Bangla**: Use natural, everyday speech (e.g., "নগদ দিন" instead of "পেমেন্ট সম্পন্ন করুন").
4. **Prefer Numbers**: Use "5 seats" instead of "Five seats".
5. **No English Tech Terms**: Avoid using English words like "Confirm" or "Login" in the Bangla interface.

## Validation Step
Before submitting any UI change, ask:
- [ ] Is it necessary?
- [ ] Is it simple?
- [ ] Is it bilingual?
- [ ] Does it use design tokens?

---
*Created on 2026-04-19*
