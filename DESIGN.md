# Earn Money by Driving or Get a CNG Booking Now

## Mission
Create implementation-ready, token-driven UI guidance for Earn Money by Driving or Get a CNG Booking Now that is optimized for consistency, accessibility, and fast delivery across dashboard web app.

## Brand
- Product/brand: Earn Money by Driving or Get a CNG Booking Now
- URL: https://cnglagbe.vercel.app/

## Style Foundations
- Visual style: clean, functional, implementation-oriented
- Typography scale: `font.size.xs=12px`, `font.size.sm=14px`, `font.size.md=16px`, `font.size.lg=20px`, `font.size.xl=24px`, `font.size.2xl=36px`, `font.size.3xl=52px`
- Color palette: `color.surface.base=#000000`, `color.text.secondary=#ffffff`, `color.text.tertiary=#0000ee`, `color.text.inverse=#afafaf`, `color.surface.raised=#f3f3f3`, `color.surface.strong=#efefef`
- Spacing scale: `space.1=2px`, `space.2=4px`, `space.3=8px`, `space.4=10px`, `space.5=12px`, `space.6=14px`, `space.7=16px`, `space.8=18px`
- Radius/shadow/motion tokens: `radius.xs=8px`, `radius.sm=999px` | `shadow.1=rgba(0, 0, 0, 0.16) 0px 2px 8px 0px` | `motion.duration.instant=200ms`, `motion.duration.fast=300ms`, `motion.duration.normal=500ms`

## Accessibility
- Target: WCAG 2.2 AA
- Keyboard-first interactions required.
- Focus-visible rules required.
- Contrast constraints required.

## Writing Tone
Concise, confident, implementation-focused.

## Rules: Do
- Use semantic tokens, not raw hex values, in component guidance.
- Every component must define states for default, hover, focus-visible, active, disabled, loading, and error.
- Component behavior should specify responsive and edge-case handling.
- Interactive components must document keyboard, pointer, and touch behavior.
- Accessibility acceptance criteria must be testable in implementation.

## Rules: Don't
- Do not allow low-contrast text or hidden focus indicators.
- Do not introduce one-off spacing or typography exceptions.
- Do not use ambiguous labels or non-descriptive actions.
- Do not ship component guidance without explicit state rules.

## Guideline Authoring Workflow
1. Restate design intent in one sentence.
2. Define foundations and semantic tokens.
3. Define component anatomy, variants, interactions, and state behavior.
4. Add accessibility acceptance criteria with pass/fail checks.
5. Add anti-patterns, migration notes, and edge-case handling.
6. End with a QA checklist.

## Required Output Structure
- Context and goals.
- Design tokens and foundations.
- Component-level rules (anatomy, variants, states, responsive behavior).
- Accessibility requirements and testable acceptance criteria.
- Content and tone standards with examples.
- Anti-patterns and prohibited implementations.
- QA checklist.

## Component Rule Expectations
- Include keyboard, pointer, and touch behavior.
- Include spacing and typography token requirements.
- Include long-content, overflow, and empty-state handling.
- Include known page component density: links (174), lists (34), buttons (27), inputs (16), navigation (2).

- Extraction diagnostics: Audience and product surface inference confidence is low; verify generated brand context.

## Quality Gates
- Every non-negotiable rule must use "must".
- Every recommendation should use "should".
- Every accessibility rule must be testable in implementation.
- Teams should prefer system consistency over local visual exceptions.
