# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OctoSSO is a browser extension that automatically handles GitHub's single sign-on (SSO) authentication prompts. It helps users avoid repeatedly clicking through SSO prompts for organizations by automatically clicking the necessary links and buttons.

## Key Commands

```bash
# Development
npm run dev          # Watch mode for development (vite build --watch)

# Build
npm run build        # Build the extension (TypeScript compilation + Vite build)
npm run clean        # Clean dist folder and zip files

# Quality checks
npm run typecheck    # Type checking (tsc --noEmit)
npm run lint         # Run all linters (Biome + Prettier)
npm run fix          # Auto-fix linting issues

# Package
npm run package      # Clean, build, and create octosso.zip for distribution
```

## Architecture

### Browser Extension Structure

- **Content Script** (`src/content/index.ts`): Injected into GitHub pages to detect and handle SSO prompts
- **Manifest** (`public/manifest.json`): Chrome extension manifest v3 configuration
- **Build Output** (`dist/`): Contains the compiled extension files

### Core Functionality

The extension operates by:

1. Detecting SSO prompt pages on GitHub (organization SSO pages, notification page, profile page, top page)
2. Automatically clicking through SSO authentication links and continue buttons
3. Using MutationObserver for lazy-loaded content on the GitHub dashboard

### Build System

- **Vite**: Bundles the TypeScript content script into `dist/content.js`
- **TypeScript**: Strict mode enabled with comprehensive type checking
- **Linting**: Biome for code analysis, Prettier for formatting

## Development Guidelines

- The extension focuses on Chrome/Firefox with Manifest V3
- All source code is in TypeScript under `src/`
- Content script runs at `document_end` on `https://github.com/*`
- No minification in the build for easier debugging
- Package script creates a distributable zip file for browser stores
