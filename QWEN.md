# SlideSpeaker Web - QWEN.md

## Project Overview

SlideSpeaker Web is a Next.js + React frontend application for the SlideSpeaker project. It serves as a standalone web interface for transforming presentations into rich multimedia experiences. The application is designed to work alongside a separate FastAPI backend service and can be moved to its own git repository.

### Key Technologies

- **Framework**: Next.js 15+ (with App Router)
- **Language**: TypeScript 5+
- **Styling**: SCSS with CSS Modules, Google Fonts (Open Sans)
- **Design System**: Flat 3.0-inspired token set defined in `src/styles/_variables.scss`
- **Authentication**: NextAuth.js for user authentication
- **State Management**: Zustand for state management, React Query for server state
- **Internationalization**: next-intl for multi-language support
- **Styling**: CSS-in-JS with theme support (light, dark, high contrast)
- **Package Manager**: pnpm

### Supported Languages

- English (en)
- Simplified Chinese (zh-CN)
- Traditional Chinese (zh-TW)
- Japanese (ja)
- Korean (ko)
- Thai (th)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── [locale]/          # Locale-specific routes
│   ├── api/               # API routes
│   ├── creations/         # Creation-related pages
│   ├── login/             # Login page
│   ├── profile/           # Profile page
│   ├── tasks/             # Task management
│   └── ...                # Other pages
├── auth/                  # Authentication utilities
├── components/            # React components
├── hooks/                 # Custom React hooks
├── i18n/                  # Internationalization configuration
├── services/              # API service clients
├── stores/                # Zustand stores
├── styles/                # Global styles
├── theme/                 # Theme-related utilities
├── types/                 # TypeScript type definitions
├── utils/                 # Utility functions
└── navigation.ts          # Navigation utilities
```

## Building and Running

### Prerequisites

- Node.js >= 20.0.0
- pnpm package manager

### Setup and Development

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Update environment variables as needed
# NEXT_PUBLIC_API_BASE_URL: URL of the SlideSpeaker API server
# NEXTAUTH_URL: Public URL for the web app
# NEXTAUTH_SECRET: Session signing secret
# Optional: Provider keys for OAuth

# Run the development server
pnpm dev

# Build for production
pnpm build

# Run production build
pnpm start
```

## Development Conventions

### Code Quality

- The project uses a pre-commit hook that automatically runs ESLint, TypeScript type checking, and Prettier on staged files
- ESLint with Next.js recommended rules is enforced
- TypeScript strict mode is enabled
- Prettier for consistent code formatting

### Scripts

- `pnpm lint`: Run ESLint on src, middleware.ts, and next.config.mjs
- `pnpm lint:fix`: Auto-fix linting issues
- `pnpm typecheck`: Run TypeScript type checking
- `pnpm typecheck:tests`: Type check test files
- `pnpm check`: Run both linting and type checking
- `pnpm test`: Run Jest tests
- `pnpm test:watch`: Run Jest in watch mode
- `pnpm dev`: Start development server on http://localhost:3000

### Internationalization

- The application supports multiple languages via the `next-intl` package
- Language is determined by locale prefix in the URL or user preferences
- The middleware handles locale detection and redirects

### Theming & Visual Language

- The application supports light, dark, and high-contrast themes
- Themes are persisted in localStorage and respect system preferences
- JavaScript code in layout.tsx applies the initial theme before hydration
- UI surfaces follow the Flat 3.0 direction: bold accent gradients, soft neutral cards, and responsive typography using the shared CSS custom properties
- Use the accent palette (`--color-accent`, `--color-accent-secondary`, `--color-accent-tertiary`) for primary/secondary actions; legacy indigo gradients (`#6366f1` etc.) should be avoided
- The product name must always appear as the literal English string “SlideSpeaker AI”, even in localized contexts

### Authentication

- NextAuth.js handles user authentication
- Middleware redirects unauthenticated users to login for protected routes
- Protected routes exclude public paths like `/login` and `/api/auth`

### State Management

- Client state: Zustand stores for local application state
- Server state: React Query for API data fetching and caching
- Session state: NextAuth session provider

## File Descriptions

- `middleware.ts`: Authentication and internationalization middleware
- `next.config.mjs`: Next.js configuration with internationalization plugin
- `tsconfig.json`: TypeScript configuration with strict settings
- `package.json`: Dependencies, scripts, and lint-staged configuration
- `eslint.config.mjs`: ESLint configuration
- `.env.example`: Example environment variables
- `jest.config.js`: Jest testing configuration
- `navigation.ts`: Navigation utilities
