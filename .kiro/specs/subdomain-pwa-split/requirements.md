# Requirements Document: Subdomain-Based PWA Split

## Introduction

This feature implements subdomain-based routing to serve two distinct Progressive Web Apps (PWAs) from a single Next.js monolith. The user-facing app will be served at `cnglagbe.com` while the driver app will be served at `driver.cnglagbe.com`. Both apps share backend infrastructure, authentication, and API routes but present different UI shells and PWA configurations tailored to their respective user roles.

## Glossary

- **Subdomain_Router**: Middleware component that detects the subdomain from the host header and routes requests appropriately
- **PWA_Shell**: The user interface and Progressive Web App configuration specific to either the user or driver application
- **Auth_System**: JWT-based authentication system with role claims (user | driver)
- **Manifest_Generator**: Component that serves subdomain-specific PWA manifest files
- **Role_Detector**: Client-side component that determines which app is running based on hostname
- **Session_Cookie**: httpOnly, Secure authentication cookie with SameSite=Lax and domain set to `.cnglagbe.com`

## Requirements

### Requirement 1: Subdomain Detection and Routing

**User Story:** As a system architect, I want middleware to detect the subdomain from the host header, so that the correct PWA shell is served based on the subdomain.

#### Acceptance Criteria

1. WHEN a request is received, THE Subdomain_Router SHALL extract the hostname from the request headers
2. WHEN the hostname is `cnglagbe.com` or `www.cnglagbe.com`, THE Subdomain_Router SHALL route to the user PWA shell
3. WHEN the hostname is `driver.cnglagbe.com`, THE Subdomain_Router SHALL route to the driver PWA shell
4. WHEN the hostname does not match known subdomains, THE Subdomain_Router SHALL return a 404 error
5. THE Subdomain_Router SHALL execute before all other route handlers

### Requirement 2: PWA Manifest Configuration

**User Story:** As a user or driver, I want each app to have its own PWA identity, so that I can install and distinguish between the two apps on my device.

#### Acceptance Criteria

1. WHEN a request is made to `/manifest.json` from `cnglagbe.com`, THE Manifest_Generator SHALL serve the user app manifest with user-specific branding
2. WHEN a request is made to `/manifest.json` from `driver.cnglagbe.com`, THE Manifest_Generator SHALL serve the driver app manifest with driver-specific branding
3. THE Manifest_Generator SHALL include unique name, short_name, icons, and theme_color for each subdomain, sourced from the `TEXT` dictionary to support both English and Bengali
4. THE Manifest_Generator SHALL ensure names follow the "Max 2-3 words" and "No Jargon" rules from `docs/ui-rules.md`
5. THE Manifest_Generator SHALL set the start_url relative to the subdomain
6. THE Manifest_Generator SHALL include appropriate display mode and orientation settings for each app type

### Requirement 3: Cross-Subdomain Authentication

**User Story:** As a developer, I want authentication cookies to work across both subdomains, so that users can maintain their session when the system redirects them between apps.

#### Acceptance Criteria

1. WHEN the Auth_System creates a Session_Cookie, THE Auth_System SHALL set the domain attribute to `.cnglagbe.com`
2. WHEN the Auth_System creates a Session_Cookie, THE Auth_System SHALL set httpOnly to true
3. WHEN the Auth_System creates a Session_Cookie, THE Auth_System SHALL set Secure to true
4. WHEN the Auth_System creates a Session_Cookie, THE Auth_System SHALL set SameSite to Lax (sufficient for subdomains)
5. WHEN a request is made to either subdomain with a valid Session_Cookie, THE Auth_System SHALL authenticate the user

### Requirement 4: Role-Based Access Control and Redirects

**User Story:** As a user or driver, I want to be automatically redirected to the correct app for my role, so that I don't access features not intended for me.

#### Acceptance Criteria

1. WHEN a user with role "driver" accesses `cnglagbe.com`, THE Subdomain_Router SHALL redirect to `driver.cnglagbe.com`
2. WHEN a user with role "user" accesses `driver.cnglagbe.com`, THE Subdomain_Router SHALL redirect to `cnglagbe.com`
3. WHEN an unauthenticated user accesses either subdomain, THE Subdomain_Router SHALL allow access to public routes
4. WHEN an authenticated user accesses a protected route on the wrong subdomain, THE Subdomain_Router SHALL redirect before rendering the page
5. THE Subdomain_Router SHALL preserve the original path when redirecting between subdomains

### Requirement 5: Client-Side App Role Detection

**User Story:** As a developer, I want client-side code to detect which app is running, so that components can render role-specific UI and behavior.

#### Acceptance Criteria

1. THE Role_Detector SHALL determine app role by examining `window.location.hostname`
2. WHEN `window.location.hostname` is `cnglagbe.com` or `www.cnglagbe.com`, THE Role_Detector SHALL return "user"
3. WHEN `window.location.hostname` is `driver.cnglagbe.com`, THE Role_Detector SHALL return "driver"
4. THE Role_Detector SHALL provide a React hook for components to access the current app role
5. THE Role_Detector SHALL handle hostname detection on both client and server (SSR)

### Requirement 6: Shared API Routes

**User Story:** As a developer, I want API routes to be accessible from both subdomains, so that I can maintain a single backend implementation.

#### Acceptance Criteria

1. WHEN an API request is made from either subdomain, THE Subdomain_Router SHALL route to the same API handler
2. THE Subdomain_Router SHALL not apply role-based redirects to API routes
3. WHEN an API route requires authentication, THE Auth_System SHALL validate the Session_Cookie regardless of subdomain
4. THE Subdomain_Router SHALL set appropriate CORS headers for cross-subdomain API requests
5. API routes SHALL enforce role-based authorization independently of subdomain routing

### Requirement 7: Development and Production Environment Support

**User Story:** As a developer, I want the subdomain routing to work in both local development and production environments, so that I can test the feature before deployment.

#### Acceptance Criteria

1. WHEN running in development mode, THE Subdomain_Router SHALL support localhost with port-based subdomain simulation
2. WHEN running in production on Vercel or Railway, THE Subdomain_Router SHALL use actual subdomain detection
3. THE Subdomain_Router SHALL provide configuration for environment-specific domain names
4. WHEN the environment is development, THE Subdomain_Router SHALL accept `localhost:3000` as user app and `driver.localhost:3000` as driver app
5. THE Subdomain_Router SHALL log subdomain detection results in development mode for debugging

### Requirement 8: UI Shell Separation

**User Story:** As a developer, I want clear separation between user and driver UI components, so that each app only loads the code it needs.

#### Acceptance Criteria

1. THE Subdomain_Router SHALL serve different root layout components based on subdomain
2. WHEN serving the user app, THE Subdomain_Router SHALL use the user-specific layout and page components
3. WHEN serving the driver app, THE Subdomain_Router SHALL use the driver-specific layout and page components
4. ALL layout metadata (titles, descriptions) SHALL be fetched from the `TEXT` dictionary and follow rural-friendly word limits
4. THE Subdomain_Router SHALL support shared components that can be used by both apps
5. THE Subdomain_Router SHALL enable code splitting so each app only bundles its required components
