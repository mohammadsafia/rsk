# RSK app (Next.js)

Notes for AI coding agents working in this app.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## This app

- Pages are App Router files under `app/[lang]` (the language is the first URL segment); signed-in pages under
  `app/[lang]/(app)`, whose layout checks the session. Screens (client components) live in `src/screens`, imported as
  `@pages/*`.
- The UI kit is copied into `src/` (`src/components`, `src/lib`, `src/blocks`, …) and updated with `pnpm kit:update`;
  `pnpm kit:add` adds blocks and generates their pages under `app/`. Read `kit.lock.json` before editing a kit file.
- Checks: `vp check` (format, lint), `vp test`, and `next typegen && tsc -b` for types. `next build` builds.

## Kit rules

- The kit's components are client components; the kit has no Server Components. Keep `next/*` out of `src/components`
  and `src/lib`: the same files ship to a Vite app. Links and navigation go through `KitLink` and `useKitNavigate`.
- Server code imports `server-only` and lives in `src/server`, a route handler or a server action. Secrets are
  unprefixed env vars (`getServerEnv()`); only `NEXT_PUBLIC_*` reaches the browser.
- The browser never holds the API token: it calls `/api/*`, and server code calls the API with `callApi`.
- Every page exports `generateMetadata` through `pageMetadata` (`src/server/seo.ts`).

## Vite-only skills

The kit's `forge:create-page`, `forge:create-api` and `forge:debug-build` skills write React Router and Vite code. In
this app instead:

- **A page:** add `app/[lang]/<path>/page.tsx` (a Server Component with `generateMetadata`) rendering a screen from
  `src/screens`; add it to `APP_MENU` in `src/routes/routes.ts` and, if it's behind sign-in, to `PROTECTED` in
  `src/server/route-decision.ts`.
- **An API call:** the browser fetches `/api/<path>` (`app/api/[...path]/route.ts` forwards it with the session's
  token); Server Components and server actions use `callApi`. See the members example.
- **A build failure:** run `next typegen && tsc -b` for types and `next build` for the rest; `vp check` for lint.
