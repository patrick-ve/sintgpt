# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Sinterklaas Poem Generator built with Nuxt 3 - an AI-powered web application that creates personalized Sinterklaas poems using Google Gemini 2.5 Pro. Users can input recipient details, optionally enrich data from LinkedIn profiles, and generate custom poems in Dutch or English with various styles and rhyme schemes.

## Key Commands

### Development
- `yarn dev` - Start development server (runs with --host flag for network access)
- `yarn build` - Build for production
- `yarn generate` - Generate static site
- `yarn preview` - Preview production build

## Architecture

### Core Technology Stack
- **Framework**: Nuxt 3 with TypeScript
- **UI**: Nuxt UI 3 + Tailwind CSS 4
- **AI Integration**: Google Gemini 2.5 Pro via Vercel AI SDK (`@ai-sdk/google`)
- **Data Enrichment**: Enrich Layer API for LinkedIn profile data

### Key Architectural Patterns

**Server API Design**
- Server-side operations in `server/api/` directory handle AI and external API calls
- Uses `useRuntimeConfig()` to access `GOOGLE_GENERATIVE_AI_API_KEY` and `ENRICH_LAYER_API_KEY` environment variables
- Poem generation endpoint at `/api/poem/generate.post.ts`
- Validates request data using Zod schema

**Poem Generation Flow**
1. User fills out form in `pages/index.vue` with recipient details
2. Optional: If LinkedIn URL provided, server fetches profile data from Enrich Layer API
3. `usePoemGenerator` composable sends form data via `$fetch` to `/api/poem/generate`
4. Server builds dynamic prompt incorporating:
   - Recipient name (required)
   - Job title (from LinkedIn or manual input, optional)
   - Employer (from LinkedIn, optional)
   - Biography (from LinkedIn, optional)
   - Present description (optional)
   - Style (funny, classic, ironic, old-fashioned)
   - Rhyme scheme (AABB, ABBA, Limerick)
   - Number of lines (8-20)
   - Output language (Dutch or English)
5. Gemini 2.5 Pro generates the poem using `generateText()` with temperature 0.8
6. Poem is displayed in the UI with copy-to-clipboard functionality

**Form Fields**
- **Required**: Recipient name, poem style, rhyme scheme, number of lines, language
- **Optional**: Job title, Sinterklaas present, LinkedIn profile URL

**LinkedIn Enrichment**
- Enrich Layer API endpoint: `https://enrichlayer.com/api/v2/profile`
- Retrieves: current employer, job title (headline), and professional biography (summary)
- Falls back gracefully if LinkedIn data fetch fails
- Uses manual job title if no LinkedIn URL provided

**Poem Customization Options**
- **Styles**: Funny, Classic, Ironic, Old Fashioned
- **Rhyme Schemes**: AABB (couplets), ABBA (enclosed), Limerick (AABBA)
- **Lines**: 8-20 lines (configurable via slider)
- **Languages**: Dutch or English

### Coding Conventions (from .cursorrules)
- Use Composition API with `<script setup>` style
- Functional and declarative programming patterns (no classes)
- Auto-imports enabled for Vue composables (ref, useState, useRouter, etc.)
- Use `@nuxtjs/color-mode` with `useColorMode()` for theme handling
- Composables named as `use<MyComposable>` in `composables/` directory
- PascalCase for component file names
- TypeScript: prefer interfaces over types, avoid enums
- Data fetching: `useFetch` for SSR, `$fetch` for client-side/event handlers, `useAsyncData` for complex logic
- Use `<NuxtImage>` or `<NuxtPicture>` for images, Nuxt Icons module for icons
- SEO: `useHead` and `useSeoMeta`

### Environment Variables
Required in `.env`:
```
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key
ENRICH_LAYER_API_KEY=your_enrich_layer_api_key
```

### Error Handling
- Validation errors (Zod) return 400 status
- AI API errors are caught and returned with appropriate status codes
- LinkedIn enrichment failures are logged but don't block poem generation
- UI displays errors in alert component
