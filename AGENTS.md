<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## UI/UX Rules (MANDATORY)
Refer to [/docs/ui-rules.md](file:///Users/patwary/Projects/CNGLagbe/docs/ui-rules.md) for full compliance. Key rules:
1. **Max 3 font sizes** per screen.
2. **Simple Language**: Max 2-3 words per label. Use conversational tone (e.g., "Cash" vs "Payment").
3. **Always show**: Fare, time, and distance for all rides.
4. **No hidden critical info**: All essential ride/user data must be visible.
5. **Clear Action Text**: All buttons must have explicit, action-oriented text.
6. **No Hardcoded Strings**: All UI text must use the central `TEXT` dictionary.
7. **Consistent Spacing**: Use design tokens; no ad-hoc margins.
10. **Icon Labels**: All icons must have accompanying text labels for low literacy users.
11. **Enforce Checklist**: Before adding any UI, verify against the checklist in `/docs/ui-rules.md`.

## Form Validation & State Management
1. **Schemas First**: All forms MUST have a Zod schema defined in `lib/schemas/`.
2. **Unified State**: Use `react-hook-form` for all form state management. Avoid local `useState` for individual fields.
3. **Zod Resolver**: Connect schemas to forms using `@hookform/resolvers/zod`.
4. **Standard Fields**: Use the `FormField` component for inputs to ensure consistent error styling and ref forwarding.
5. **Step-wise Validation**: In multi-step forms, use `trigger(['field1', 'field2'])` to validate current step fields before proceeding.
6. **Types**: Always export the input type using `z.infer<typeof schema>`.

## Taste & Regression Tracking (taste.md)
1. **Always Update**: Whenever you fix a bug, address an edge case, or implement a specific UI/UX preference requested by the user, you MUST document it in `taste.md`.
2. **Review First**: Before making UI or behavioral changes, quickly review `taste.md` to ensure you aren't breaking previously established preferences or fixes.
<!-- END:nextjs-agent-rules -->
