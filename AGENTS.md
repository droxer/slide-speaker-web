# Repository Guidelines

## Project Structure & Module Organization

- `src/app` hosts the Next.js App Router structure, feature pages, and route handlers; colocate page-level loaders and metadata here.
- Shared UI sits under `src/components`, while state and data hooks use `src/stores`, `src/hooks`, and `src/services` (REST adapters live here). Utilities and shared types are in `src/utils` and `src/types`.
- Locale packs live in `src/i18n`; keep translations in sync with usage.
- CSS modules and global theme tokens are under `src/styles` and `src/theme`. Static files (favicons, fonts, Open Graph images) belong in `public/`.
- Place Jest mocks in `__mocks__/`; align test fixtures with the feature directory they exercise.

## Build, Test, and Development Commands

- `pnpm dev` starts the Next.js dev server with hot reload.
- `pnpm build` compiles for production; run before tagging a release.
- `pnpm start` serves the optimized build locally.
- `pnpm test` runs the Jest suite once; use `pnpm test:watch` for TDD loops.
- `pnpm lint`, `pnpm typecheck`, and `pnpm check` enforce ESLint + TypeScript baselines; fix warnings before opening a PR.

## Coding Style & Naming Conventions

- Prettier enforces 2-space indentation, 80-char line width, semicolons, and single quotes; format with `pnpm exec prettier --write <files>`.
- Follow the Next.js/TypeScript lint ruleset (`eslint.config.mjs`); avoid disabling rules inline unless there is a documented exception.
- Use PascalCase for React components, camelCase for hooks/utilities, and uppercase snake case for constants (e.g., `API_BASE_URL`).
- Co-locate component-specific styles in `.module.scss` files to keep scope narrow.

## Design Language & Branding

- Adopt the “Flat 3.0” visuals across surfaces and controls by using the design tokens defined in `src/styles/_variables.scss` (`--color-*`, `--font-size-*`, etc.).
- Headline treatments favor large typography: use the responsive clamp-based sizes (`--font-size-display`, `--font-size-h1`, `--font-size-lead`) rather than hard-coded pixel values.
- Primary actions lean on the accent spectrum (`var(--color-accent)`, `var(--color-accent-strong)`), with soft neutrals for secondary states; avoid re-introducing legacy gradients such as `#6366f1`.
- The product name must remain “SlideSpeaker AI” verbatim for every locale and UI surface; never translate or stylize the wording itself.

## Testing Guidelines

- Jest (`jest.config.js`) targets `src/**/__tests__` and `*.test.ts(x)` or `*.spec.ts(x)`. Mirror the directory of the code under test.
- Prefer React Testing Library patterns for UI coverage. When mocking API calls, use the helpers in `__mocks__/`.
- Maintain or raise coverage for any changed module; snapshot tests should assert meaningful UI states rather than entire trees.
- Set up environment shims in `jest.setup.ts` when browser APIs are required.

## Commit & Pull Request Guidelines

- Write imperative, present-tense commit subjects (e.g., `Add transcript panel skeleton`); include a scoped prefix when touching a single feature (`auth: update token refresh flow`).
- Keep commits focused and reference related issues in the body (`Refs #123`).
- Before submitting a PR, run `pnpm check`, `pnpm test`, and `pnpm build`. Attach screenshots or GIFs for UI changes and summarize any schema or API impacts.
- Link tracking tickets, call out follow-ups, and describe manual verification steps in the PR description to speed up reviews.

## Environment & Secrets

- Copy `.env.example` to `.env.local` for local runs; never commit real secrets.
- Regenerate OAuth or third-party keys using the infrastructure playbooks in the internal wiki, and store them in the shared secret manager—not in the repo.
