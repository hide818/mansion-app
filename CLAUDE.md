# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
```

No test suite is configured.

Audio features (AI議事録) require `ffmpeg` installed locally (`brew install ffmpeg`).

## Architecture

**マンション管理会社向けSaaS** — a Next.js 16 App Router application for condominium management companies.

### Tech stack
- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4
- Supabase (auth + database)
- OpenAI API (text generation, audio transcription)
- html2canvas + jspdf (PDF export)

### Multi-tenancy
All data is scoped to `company_id`. Every Supabase query from authenticated routes must filter by `company_id`, retrieved via `getUserCompanyId()` (`lib/getUserCompanyId.ts`).

### Auth & roles
- `middleware.ts` intercepts all requests, checks Supabase session, redirects to `/login` if unauthenticated.
- Roles are stored in `profiles.role`: `admin | general | viewer`.
- Role helpers: `getUserRole()` (`lib/getUserRole.ts`), permission checks in `lib/permissions.ts` (`canEdit`, `isAdmin`, `canManageUsers`).

### Supabase client factories
Use the correct client for the context — they are not interchangeable:
- **Server Components / API routes**: `createSupabaseServerClient()` from `lib/supabaseServer.ts`
- **Client Components**: `createSupabaseBrowserClient()` / `supabase` from `lib/supabase.ts`

### Data model (Supabase tables)
- `properties` (物件) — top-level, scoped to `company_id`
- `cases` (案件) — belong to a property, core work unit
- `tasks` — belong to a case
- `logs` — activity log entries per case
- `complaints` — per property
- `profiles` — extends Supabase auth users with `role` and `company_id`

### Route structure
Pages live under `app/`. The deepest path is `properties/[id]/cases/[caseId]/` which hosts hundreds of AI tool sub-pages (e.g. `ai-board-explanation`, `ai-estimate-comparison-table`). These pages generally fetch case/property data server-side and pass it to a client component that calls an API route.

API routes live under `app/api/`. AI-related routes are under `app/api/properties/[id]/cases/[caseId]/ai-*` and call `generateOpenAIText()` from `lib/openaiText.ts`.

### AI text generation
`lib/openaiText.ts` exports `generateOpenAIText({ systemPrompt, userPrompt })` — the shared wrapper for simple text completions. It calls the OpenAI Responses API with `gpt-5.4-mini`.

The AI Minutes feature (`app/api/ai-minutes/route.ts`) is more complex: it uses ffmpeg to split long audio into 20-minute chunks, transcribes each with `gpt-4o-transcribe`, then generates minutes and action items with `gpt-5.4`.

### Required environment variables (`.env.local`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`
