# SlideSpeaker Web Makefile

# Variables
NPM := npm
PNPM := pnpm
PWA_CACHE_FILES := public/sw.js public/workbox-*.js public/worker-*.js

# Default target
.PHONY: help
help:
	@echo "SlideSpeaker Web - Makefile Commands"
	@echo "================================"
	@echo "make install     - Install dependencies (uses pnpm if available, falls back to npm)"
	@echo "make dev         - Start Next.js development server (alias: make web)"
	@echo "make build       - Build production version (cleans generated PWA workers first)"
	@echo "make start       - Start production server"
	@echo "make lint        - Run ESLint code linting"
	@echo "make lint-fix     - Run ESLint with auto-fix"
	@echo "make typecheck    - Run TypeScript type checking"
	@echo "make check        - Run both linting and type checking"
	@echo "make test        - Run unit tests"
	@echo "make test-watch  - Run unit tests in watch mode"
	@echo "make clean-pwa   - Remove generated service workers"

# Install dependencies
.PHONY: install
install:
	@if command -v pnpm >/dev/null 2>&1; then \
		echo "Using pnpm to install dependencies..."; \
		pnpm install; \
	else \
		echo "Using npm to install dependencies..."; \
		npm install; \
	fi

# Development server
.PHONY: dev
dev:
	@if command -v pnpm >/dev/null 2>&1; then \
		pnpm dev; \
	else \
		npm run dev; \
	fi

.PHONY: web
web: dev

# Remove generated service workers to avoid stale caches between builds
.PHONY: clean-pwa
clean-pwa:
	@echo "Cleaning generated PWA artifacts..."
	@rm -f $(PWA_CACHE_FILES)

# Build production version
.PHONY: build
build: clean-pwa
	@if command -v pnpm >/dev/null 2>&1; then \
		pnpm build; \
	else \
		npm run build; \
	fi

# Start production server
.PHONY: start
start:
	@if command -v pnpm >/dev/null 2>&1; then \
		pnpm start; \
	else \
		npm run start; \
	fi

# Linting
.PHONY: lint
lint:
	@if command -v pnpm >/dev/null 2>&1; then \
		pnpm run lint; \
	else \
		npm run lint; \
	fi

# Linting with auto-fix
.PHONY: lint-fix
lint-fix:
	@if command -v pnpm >/dev/null 2>&1; then \
		pnpm run lint:fix; \
	else \
		npm run lint:fix; \
	fi

# Type checking
.PHONY: typecheck
typecheck:
	@if command -v pnpm >/dev/null 2>&1; then \
		pnpm run typecheck; \
	else \
		npm run typecheck; \
	fi

# Combined lint and type check
.PHONY: check
check:
	@if command -v pnpm >/dev/null 2>&1; then \
		pnpm run check; \
	else \
		npm run check; \
	fi

# Run tests
.PHONY: test
test:
	@if command -v pnpm >/dev/null 2>&1; then \
		pnpm test; \
	else \
		npm test; \
	fi

.PHONY: test-watch
test-watch:
	@if command -v pnpm >/dev/null 2>&1; then \
		pnpm test:watch; \
	else \
		npm run test:watch; \
	fi

.DEFAULT_GOAL := help
