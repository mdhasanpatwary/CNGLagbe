# CNGLagbe

**On-time CNG Booking Service for Chhagalnaiya Upazila**

CNGLagbe is a lightweight dispatch and availability network connecting passengers with local CNG drivers in rural Bangladesh. The platform focuses on fixed-fare, on-time pickups with verified local drivers.

## Core Identity

- **Service Model**: On-time CNG booking (not full ride-sharing)
- **Service Area**: Chhagalnaiya Upazila, Feni, Bangladesh
- **Key Features**: Fixed fare, verified drivers, instant booking, local driver network
- **Platform Responsibility**: Ends once driver reaches pickup location

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design tokens
- **Animation**: Framer Motion
- **Database**: Prisma ORM
- **Authentication**: Custom auth with role-based access (User, Driver, Admin)
- **Maps**: Google Maps API
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm/bun
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables (copy `.env.example` to `.env.local`):

```env
DATABASE_URL="postgresql://..."
GOOGLE_MAPS_API_KEY="your-api-key"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-api-key"
```

4. Run database migrations:

```bash
npx prisma migrate dev
```

5. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
CNGLagbe/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Landing page
│   ├── user/              # User dashboard
│   ├── dashboard/         # Driver dashboard
│   └── admin/             # Admin panel
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── landing/          # Landing page components
│   └── layout/           # Layout components
├── lib/                   # Utility functions
│   ├── schemas/          # Zod validation schemas
│   └── utils.ts          # Helper functions
├── constants/            # App constants
│   └── text.ts          # Centralized text dictionary (i18n)
├── prisma/              # Database schema and migrations
└── public/              # Static assets
```

## Key Features

### Landing Page
- Modern, mobile-first design with scroll animations
- Trust elements (driver count, safety badges, testimonials)
- Multiple CTAs with magnetic hover effects
- Responsive sections: Hero, Features, How It Works, FAQ, etc.
- Bilingual support (English/Bangla)

### User Dashboard
- Book CNG with pickup/destination selection
- View active and past bookings
- Real-time booking status updates
- Cancel bookings with reason tracking

### Driver Dashboard
- Accept/reject booking requests
- View assigned bookings
- Navigate to pickup locations
- Complete ride confirmations

### Admin Panel
- User and driver management
- Booking oversight
- System analytics

## Component Library

### UI Components

- **Section**: Wrapper with spotlight effect and variant backgrounds
- **SectionHeading**: Consistent section titles with animations
- **Magnetic**: Desktop hover effect for CTAs
- **Reveal**: Scroll-triggered fade-in animations
- **Tilt**: 3D tilt effect for cards
- **AppButton**: Primary button component with variants

### Landing Components

- **TrustBadge**: Display trust indicators
- **FeatureCard**: Feature information cards
- **ReviewCard**: User testimonial cards
- **RouteCard**: Popular route quick-access buttons
- **FaqItem**: Accordion-style FAQ items
- **AppDownloadCard**: App download promotion cards

See [Component Documentation](#component-documentation) for usage examples.

## Text Dictionary

All user-facing text is centralized in `constants/text.ts` for consistency and easy translation. Use the `useLang` hook to access text:

```typescript
import { useLang } from "@/hooks/useLang";

function MyComponent() {
  const { t } = useLang();
  return <h1>{t("hero_headline")}</h1>;
}
```

## Development Guidelines

### Code Standards

- Use TypeScript for type safety
- Follow component-based architecture
- Use Tailwind design tokens (no hardcoded values)
- All text must use TEXT dictionary (no hardcoded strings)
- Maximum 3 font sizes per screen
- Simple language (max 2-3 words per button label)

### Form Validation

- All forms use Zod schemas (defined in `lib/schemas/`)
- Use `react-hook-form` with `@hookform/resolvers/zod`
- Use `FormField` component for consistent styling

### Accessibility

- WCAG AA compliance required
- Keyboard navigation for all interactive elements
- Visible focus indicators
- Semantic HTML (section, nav, footer, button)
- ARIA labels for icon-only buttons
- Alt text for all images

### Performance

- Lazy load images below the fold
- Use CSS transforms for animations (not position)
- Respect `prefers-reduced-motion`
- Optimize bundle size with tree-shaking

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## Deployment

The application is deployed on Vercel:

**Production**: [https://cnglagbe.vercel.app](https://cnglagbe.vercel.app)

### Deploy Your Own

1. Push to GitHub
2. Import project to Vercel
3. Configure environment variables
4. Deploy

## Component Documentation

### Section Component

Provides consistent section structure with spotlight effect and variant backgrounds.

```typescript
import { Section } from "@/components/ui/Section";

<Section variant="mesh" id="features">
  <h2>Features</h2>
  {/* content */}
</Section>
```

**Variants**: `default`, `mesh`, `premium`, `white`, `slate`, `glass`, `dark`, `primary`, `subtle`

### Magnetic Component

Creates magnetic pull effect toward cursor on desktop (respects reduced motion).

```typescript
import { Magnetic } from "@/components/ui/Magnetic";

<Magnetic>
  <button>Book Now</button>
</Magnetic>
```

### FeatureCard Component

Display feature information with icon, title, and description.

```typescript
import { FeatureCard } from "@/components/landing/FeatureCard";
import { Zap } from "lucide-react";

<FeatureCard
  icon={<Zap />}
  title="Fast Booking"
  sub="Book in seconds"
/>
```

### TrustBadge Component

Display trust indicators with icon and label.

```typescript
import { TrustBadge } from "@/components/landing/TrustBadge";
import { Shield } from "lucide-react";

<TrustBadge
  icon={<Shield />}
  label="Verified Drivers"
  variant="glass"
/>
```

## Contributing

1. Follow the agent rules in `AGENTS.md`
2. Ensure all tests pass
3. Maintain WCAG AA accessibility standards
4. Use TEXT dictionary for all user-facing text
5. Follow the CNGLagbe identity guidelines in `IDENTITY.md`

## License

Proprietary - All rights reserved

## Support

For issues or questions, contact the development team.
