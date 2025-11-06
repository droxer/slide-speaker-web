# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SlideSpeaker Web is a Next.js + React frontend application for transforming presentations into rich multimedia experiences. It works alongside a separate FastAPI backend service.

### Key Technologies

- **Framework**: Next.js 15+ (with App Router)
- **Language**: TypeScript 5+
- **Styling**: SCSS with CSS Modules, Google Fonts (Open Sans)
- **Design System**: Flat 3.0 token set defined in `src/styles/_variables.scss`
- **Authentication**: NextAuth.js for user authentication
- **State Management**: Zustand for client state, React Query (TanStack Query) for server state
- **Internationalization**: next-intl for multi-language support
- **Theming**: CSS-in-JS with theme support (light, dark, high contrast)
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

## Development Commands

### Core Development Workflow

```bash
# Install dependencies (pnpm preferred)
pnpm install

# Copy and configure environment variables
cp .env.example .env
# Update NEXT_PUBLIC_API_BASE_URL to point to the backend API
# Set NEXTAUTH_SECRET for session security

# Run development server
pnpm dev

# Build for production
pnpm build

# Run production build
pnpm start
```

### Code Quality and Testing

```bash
# Run linter
pnpm lint

# Run linter with auto-fix
pnpm lint:fix

# Run TypeScript type checking
pnpm typecheck

# Run both linting and type checking
pnpm check

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

### Makefile Commands

The project also includes a Makefile for convenience:

```bash
make install     # Install dependencies
make web         # Start Next.js development server
make build       # Build production version
make lint        # Run ESLint code linting
make typecheck   # Run TypeScript type checking
make check       # Run both linting and type checking
make test        # Run unit tests
```

## Architecture Patterns

### Authentication

- NextAuth.js handles user authentication with credentials and Google OAuth providers
- Middleware in `middleware.ts` protects routes and redirects unauthenticated users to login
- Public paths are defined in `PUBLIC_PATHS` constant
- Session data includes user profile information

### Internationalization

- Uses `next-intl` for multi-language support
- Locale is determined by URL prefix (e.g., `/en/`, `/zh-CN/`)
- Default locale is English
- User's preferred language is stored in their profile and used for redirects

### State Management

- **Client State**: Zustand stores for local application state
- **Server State**: React Query (TanStack Query) for API data fetching and caching
- **Session State**: NextAuth session provider

### API Communication

- Axios-based API client in `src/services/client.ts`
- React Query hooks in `src/services/queries.ts` and `src/services/userQueries.ts`
- API base URL configured via environment variable `NEXT_PUBLIC_API_BASE_URL`

### Theming & Design Language

- Supports light, dark, and high-contrast themes
- Themes are persisted in localStorage and respect system preferences
- Initial theme is applied via JavaScript in `layout.tsx` before hydration
- Visuals follow the Flat 3.0 direction: bold accent gradients, soft neutrals, and large typographic scales from the shared CSS variables
- Prefer palette tokens such as `--color-accent`, `--color-text-primary`, `--font-size-display`; avoid reintroducing legacy hex colors
- Always render the product name as the exact English phrase “SlideSpeaker AI”, regardless of locale

## Key Components and Patterns

### App Structure

- Root layout in `src/app/layout.tsx` handles theme initialization and locale detection
- Locale-specific routing in `src/app/[locale]/layout.tsx`
- Main application shell in `src/components/AppShell.tsx`
- Studio workspace as the primary view in `src/components/StudioWorkspace.tsx`

### Data Models

- Task management for presentation processing jobs
- User profile with language and theme preferences
- Health status monitoring for backend services
- Upload management for presentation files

### Routing and Navigation

- Protected routes enforced by middleware
- Internationalized routing with locale prefixes
- Client-side navigation using `next-intl/navigation`

## Environment Variables

- `NEXT_PUBLIC_API_BASE_URL` – URL of the SlideSpeaker API server
- `NEXTAUTH_URL` – Public URL for the web app
- `NEXTAUTH_SECRET` – Session signing secret
- Optional provider keys (Google, etc.) as required by NextAuth

## Code Quality Standards

- Pre-commit hooks run ESLint, TypeScript type checking, and Prettier
- ESLint with Next.js recommended rules
- TypeScript strict mode enabled
- Prettier for consistent code formatting
