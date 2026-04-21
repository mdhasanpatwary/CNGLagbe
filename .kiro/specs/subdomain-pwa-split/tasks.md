# Implementation Plan: Subdomain-Based PWA Split

## Overview

This implementation plan breaks down the subdomain-based PWA split feature into discrete TypeScript coding tasks. Each task builds on previous steps and includes property-based testing where applicable.

## Tasks

- [ ] 1. Set up environment configuration and utilities
  - Create `.env.local` with subdomain URLs and cookie domain
  - Add TypeScript types for subdomain configuration
  - _Requirements: 7.3_

- [ ] 2. Implement subdomain detection utility
  - [ ] 2.1 Create `lib/subdomain.ts` with subdomain detection functions
    - Implement `getSubdomain(hostname: string)` function
    - Implement `isDriverSubdomain(hostname: string)` function
    - Implement `getUserSubdomainUrl(path: string)` function
    - Implement `getDriverSubdomainUrl(path: string)` function
    - Handle localhost and production hostnames
    - _Requirements: 1.1, 1.2, 1.3, 7.1, 7.4_
  
  - [ ]* 2.2 Write property test for subdomain detection
    - **Property 1: Hostname extraction**
    - **Validates: Requirements 1.1**
  
  - [ ]* 2.3 Write property test for role detection
    - **Property 9: Client-side role detection**
    - **Validates: Requirements 5.1**
  
  - [ ]* 2.4 Write unit tests for specific hostname examples
    - Test `cnglagbe.com`, `www.cnglagbe.com`, `driver.cnglagbe.com`
    - Test `localhost:3000`, `driver.localhost:3000`
    - _Requirements: 1.2, 1.3, 7.4_

- [ ] 3. Implement authentication cookie utilities
  - [/] 3.1 Create `lib/auth.ts` with cookie management functions (File exists, needs update)
    - Implement `setAuthCookie(token: string, response: Response)` function
    - Implement `getAuthCookie(request: Request)` function
    - Implement `clearAuthCookie(response: Response)` function
    - Configure cookie with domain `.cnglagbe.com`, httpOnly, secure, sameSite=Lax (Standard for subdomains)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ]* 3.2 Write property test for cookie configuration
    - **Property 4: Auth cookie configuration**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
  
  - [ ]* 3.3 Write property test for cross-subdomain authentication
    - **Property 5: Cross-subdomain authentication**
    - **Validates: Requirements 3.5**

- [ ] 4. Checkpoint - Ensure utility tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement Next.js middleware for subdomain routing
  - [ ] 5.1 Create `middleware.ts` in project root
    - Extract hostname from request headers
    - Determine subdomain using utility function
    - Skip middleware for API routes, static files, and `_next` paths
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 6.1, 6.2_
  
  - [ ] 5.2 Add JWT token validation in middleware
    - Get auth token from cookies
    - Decode JWT and extract user role
    - Handle invalid/expired tokens gracefully
    - _Requirements: 3.5, 4.3_
  
  - [ ] 5.3 Implement role-based redirect logic
    - Redirect driver role users from user subdomain to driver subdomain
    - Redirect user role users from driver subdomain to user subdomain
    - Preserve original path during redirect
    - Allow unauthenticated access to public routes
    - _Requirements: 4.1, 4.2, 4.3, 4.5_
  
  - [ ] 5.4 Configure middleware matcher
    - Exclude API routes, static files, manifest.json from middleware
    - _Requirements: 1.5, 6.2_
  
  - [ ]* 5.5 Write property test for invalid subdomain handling
    - **Property 2: Invalid subdomain handling**
    - **Validates: Requirements 1.4**
  
  - [ ]* 5.6 Write property test for role-based redirects
    - **Property 6: Role-based subdomain redirects**
    - **Validates: Requirements 4.1, 4.2**
  
  - [ ]* 5.7 Write property test for path preservation
    - **Property 8: Path preservation during redirect**
    - **Validates: Requirements 4.5**
  
  - [ ]* 5.8 Write property test for public route access
    - **Property 7: Public route access**
    - **Validates: Requirements 4.3**

- [ ] 6. Implement dynamic PWA manifest route
  - [ ] 6.1 Create `app/manifest.json/route.ts`
    - Extract hostname from request headers
    - Determine subdomain
    - Generate user manifest for user subdomain (Use `TEXT` dictionary for name/description)
    - Generate driver manifest for driver subdomain (Use `TEXT` dictionary for name/description)
    - Support bilingual manifest based on user language (cookie or query param)
    - Ensure manifest text follows "Max 2-3 words" and "No Jargon" rules
    - Return JSON response with appropriate cache headers
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [ ]* 6.2 Write property test for manifest structure
    - **Property 3: Manifest structure completeness**
    - **Validates: Requirements 2.3, 2.4, 2.5**
  
  - [ ]* 6.3 Write unit tests for manifest generation
    - Test user manifest from `cnglagbe.com`
    - Test driver manifest from `driver.cnglagbe.com`
    - _Requirements: 2.1, 2.2_

- [ ] 7. Create PWA icon assets
  - [ ] 7.1 Add user app icons to `public/icons/`
    - Create `user-icon-192.png`
    - Create `user-icon-512.png`
    - _Requirements: 2.3_
  
  - [ ] 7.2 Add driver app icons to `public/icons/`
    - Create `driver-icon-192.png`
    - Create `driver-icon-512.png`
    - _Requirements: 2.3_

- [ ] 8. Checkpoint - Ensure middleware and manifest tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement client-side app role detection hook
  - [ ] 9.1 Create `hooks/useAppRole.ts`
    - Implement `useAppRole()` hook that detects role from window.location.hostname
    - Implement `useIsDriverApp()` convenience hook
    - Handle SSR case (return default "user" role)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ]* 9.2 Write unit tests for useAppRole hook
    - Test with mocked window.location.hostname
    - Test SSR behavior
    - _Requirements: 5.1, 5.5_

- [ ] 10. Update existing auth API routes for cross-subdomain cookies
  - [ ] 10.1 Update login route to use `setAuthCookie` utility
    - Modify `app/api/auth/driver/login/route.ts`
    - Set cookie with cross-subdomain configuration
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ] 10.2 Update signup route to use `setAuthCookie` utility
    - Modify `app/api/auth/driver/signup/route.ts`
    - Set cookie with cross-subdomain configuration
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ]* 10.3 Write property test for API route redirect bypass
    - **Property 11: API route redirect bypass**
    - **Validates: Requirements 6.2, 6.3**
  
  - [ ]* 10.4 Write property test for shared API routing
    - **Property 10: Shared API routing**
    - **Validates: Requirements 6.1**

- [ ] 11. Add CORS configuration for cross-subdomain requests
  - [ ] 11.1 Create `lib/cors.ts` with CORS header utility
    - Implement function to set CORS headers for cross-subdomain requests
    - Allow credentials for authenticated requests
    - _Requirements: 6.4_
  
  - [ ] 11.2 Apply CORS headers to API routes
    - Update API route handlers to include CORS headers
    - _Requirements: 6.4_
  
  - [ ]* 11.3 Write property test for CORS headers
    - **Property 12: CORS header configuration**
    - **Validates: Requirements 6.4**

- [ ] 12. Implement role-based API authorization
  - [ ] 12.1 Create `lib/api-auth.ts` with authorization utilities
    - Implement function to validate user role for API routes
    - Ensure authorization is independent of subdomain
    - _Requirements: 6.5_
  
  - [ ]* 12.2 Write property test for API authorization
    - **Property 13: API role-based authorization**
    - **Validates: Requirements 6.5**

- [ ] 13. Checkpoint - Ensure API and auth tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Update root layout for subdomain-specific metadata
  - [ ] 14.1 Modify `app/layout.tsx` to detect subdomain
    - Use headers() to get hostname in server component
    - Set different metadata based on subdomain (Use `TEXT` dictionary strings)
    - Ensure page title and descriptions are bilingual and follow word limit rules
    - Update viewport and theme color per subdomain
    - _Requirements: 8.1_
  
  - [ ]* 14.2 Write property test for layout differentiation
    - **Property 14: Layout differentiation**
    - **Validates: Requirements 8.1**

- [ ] 15. Update next-pwa configuration
  - [x] 15.1 Modify `next.config.ts` for subdomain-aware PWA (Initial config exists)
    - Configure service worker generation
    - Ensure manifest route is not cached by service worker
    - _Requirements: 2.1, 2.2_

- [ ] 16. Add environment variable validation
  - [ ] 16.1 Create `lib/env.ts` with environment validation
    - Validate required environment variables on startup
    - Provide helpful error messages for missing variables
    - _Requirements: 7.3_

- [ ] 17. Add development mode logging
  - [ ] 17.1 Add subdomain detection logging in middleware
    - Log detected subdomain in development mode
    - Log redirect decisions
    - _Requirements: 7.5_

- [ ] 18. Final integration testing
  - [ ]* 18.1 Write integration tests for complete flow
    - Test user login → redirect to correct subdomain
    - Test driver login → redirect to correct subdomain
    - Test manifest loading from both subdomains
    - Test API calls from both subdomains
    - _Requirements: 1.2, 1.3, 2.1, 2.2, 3.5, 4.1, 4.2, 6.1_

- [ ] 19. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- [ ] Install `fast-check` library for property-based testing: `yarn add -D fast-check @types/fast-check`
- [x] Install `jose` library for Edge-compatible JWT handling: `yarn add jose`
