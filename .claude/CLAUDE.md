# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
bun run dev              # Start all apps (web + server)
bun run dev:web          # Start web app only (port 3001)
bun run dev:server       # Start server only (port 3000)

# Database
bun run db:start         # Start PostgreSQL via Docker
bun run db:push          # Push schema changes to database
bun run db:generate      # Generate migration files
bun run db:migrate       # Run migrations
bun run db:studio        # Open Drizzle Studio UI

# Code Quality
bun run check            # Lint and format with Biome
bun x ultracite fix      # Auto-fix formatting issues
bun run check-types      # TypeScript type checking
```

## Architecture

This is a Turborepo monorepo with Bun as the package manager.

### Apps

- **`apps/web`**: React frontend using TanStack Start/Router, Vite, and TailwindCSS v4. Uses shadcn/ui components.
- **`apps/server`**: Hono server running on Bun. Exposes tRPC API at `/trpc/*` and Better-Auth at `/api/auth/*`.

### Packages

- **`packages/api`**: tRPC router definitions. Exports `publicProcedure` and `protectedProcedure`. Add new routers in `src/routers/`.
- **`packages/auth`**: Better-Auth configuration with Drizzle adapter for PostgreSQL.
- **`packages/db`**: Drizzle ORM setup. Schema files in `src/schema/`. The `drizzle.config.ts` reads `.env` from `apps/server/.env`.
- **`packages/env`**: Type-safe environment variables using @t3-oss/env-core. Server env in `server.ts`, client env in `web.ts`.
- **`packages/config`**: Shared TypeScript config (`tsconfig.base.json`).

### Data Flow

1. Web app calls tRPC via `useTRPC()` hook from `src/utils/trpc.ts`
2. Server receives requests at `/trpc/*` and creates context with session from Better-Auth
3. `protectedProcedure` automatically validates session and provides typed `ctx.session`
4. Database queries use Drizzle ORM from `@badminton-app/db`

### Environment Variables

Server (`apps/server/.env`): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CORS_ORIGIN`
Web: `VITE_SERVER_URL` (must be prefixed with `VITE_` for client access)

## UI Components

**Use shadcn/ui components for everything.** The project uses the `base-maia` style with Base UI primitives.

- Add new components via: `bunx shadcn@latest add <component-name>` (run from `apps/web/`)
- Components are installed to `apps/web/src/components/ui/`
- Use existing shadcn components before creating custom ones
- Custom components should compose shadcn primitives, not replace them

## Code Standards

Uses **Ultracite** (Biome preset) for linting/formatting. Run `bun x ultracite fix` before committing.

Key rules:

- Prefer `for...of` over `.forEach()` and indexed loops
- Use `const` by default, `let` only when needed, never `var`
- Prefer `unknown` over `any`
- Use function components and call hooks at top level only
- Remove `console.log` and `debugger` statements
- Don't do early returns if it's not necessary
