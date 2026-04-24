# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server with Turbopack (requires node-compat.cjs shim)
npm run build        # Production build
npm run lint         # ESLint via next lint
npm test             # Run Vitest test suite
npm run setup        # First-time setup: install deps + prisma generate + migrate
npm run db:reset     # Reset and re-migrate the SQLite database
```

Run a single test file: `npx vitest run src/lib/some.test.ts`

## Architecture

UIGen is a Next.js 15 (App Router) app where users describe UI components in chat and Claude generates React code, rendered live in an iframe — all without touching disk.

### Request flow

```
Chat input → POST /api/chat → Vercel AI SDK streamText → Claude (Anthropic)
  → tool calls (str_replace_editor / file_manager)
  → Virtual File System (in-memory Map)
  → serialized to DB (Project.data JSON)
  → iframe receives updated VFS
  → Babel standalone transpiles JSX client-side
  → live preview renders
```

### Key layers

**Virtual File System** (`src/lib/file-system.ts`)
The core abstraction. A Map-based in-memory tree. No disk I/O — all file operations (create, edit, rename, delete) mutate this structure. Serialized as JSON into the `Project.data` column.

**Tool execution** (`src/lib/tools/`)
Claude emits structured tool calls; the API route (`src/app/api/chat/route.ts`) executes them against the VFS:
- `str-replace.ts` — view / create / str_replace / insert operations (like a text editor)
- `file-manager.ts` — rename, delete, directory ops

**Client-side transpilation** (`src/lib/transform/jsx-transformer.ts`)
Babel standalone runs in the browser to transpile JSX and build an import map so component files can reference each other without a bundler.

**AI integration**
- Provider (`src/lib/provider.ts`) — selects real Anthropic API or a mock provider when `ANTHROPIC_API_KEY` is absent
- System prompt (`src/lib/prompts/generation.tsx`) — instructs Claude how to generate code and use tools
- API route uses prompt caching (`providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' } } }`)

**State management**
- `ChatContext` (`src/lib/contexts/chat-context.tsx`) — messages, streaming state, tool call results
- `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) — VFS state, active file, file tree

**Persistence** (`prisma/schema.prisma`)
The authoritative source for all database structure. SQLite via Prisma. Two models: `User` (email + bcrypt password) and `Project` (name, messages JSON, data JSON, userId FK with cascade delete). Auth uses JWT cookies via `jose`. Always read this file when reasoning about stored data shape.

**Path alias**: `@/*` maps to `src/*`.

## Environment

Copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY`. Without it the app falls back to a mock provider that returns placeholder responses.

## Testing

Tests use Vitest with jsdom environment and React Testing Library. Config is in `vitest.config.mts`.

## Code style

Use comments sparingly — only on complex code where the reason isn't obvious from reading it.
