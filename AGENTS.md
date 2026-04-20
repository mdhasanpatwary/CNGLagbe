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
8. **Icon Labels**: All icons must have accompanying text labels for low literacy users.
9. **Enforce Checklist**: Before adding any UI, verify against the checklist in `/docs/ui-rules.md`.
<!-- END:nextjs-agent-rules -->
