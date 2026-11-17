# RSK app

A React 18 + TypeScript app on [Vite+](https://viteplus.dev), started from the RSK UI kit.

> This repository is generated from [mohammadsafia/rsk](https://github.com/mohammadsafia/rsk) on every push to its `main`. Changes to the kit belong there; changes pushed here are overwritten by the next sync.

## What's inside

- **UI kit** (`src/components`): `ui` primitives, `shared` composites, `forms` (react-hook-form fields, FormWizard), `tables` (DataTable with filters and bulk selection), `charts` (recharts), `calendar` (CalendarGrid scheduler).
- **App shell** (`src/layouts`): sidebar, header, command palette, auth guard, error boundary.
- **Design tokens** (`src/styles`): semantic colours, light and dark themes, RTL-ready.
- **i18n** (`src/locales`): English and Arabic, with direction switching.
- **Data**: axios + react-query (`src/api`), nuqs for URL state.

## Getting started

```bash
vp create github:mohammadsafia/rsk-starter -- my-app   # or clone this repository
cd my-app
cp .env.example .env    # fill in your API and auth settings
vp install
vp dev
```

The dev server opens on port 3000 and proxies nothing. To run two copies side by side, or to send `/api` to a local
API, set these when you start it (none is `VITE_`-prefixed, so none reaches the browser bundle):

```bash
FRONTEND_PORT=5101 API_PROXY_TARGET=http://localhost:5080 pnpm dev
```

`FRONTEND_PORT` is strict: a taken port stops the server instead of moving it to another one. `API_PROXY_PATH`
changes the proxied path (default `/api`), and `FRONTEND_OPEN=false` stops it opening a browser tab.

The app starts in the dark theme. To start in light, or follow the system, pass `defaultTheme="light"` (or
`"system"`) to `ThemeProvider` in `src/bootstrap.tsx`; the person's own choice is remembered over it.

The fonts (Schibsted Grotesk, Noto Kufi Arabic, Spline Sans Mono) come from the `@fontsource-variable` packages and
are served with the app: no font host is contacted at build or run time.

## Your brand colour

```bash
pnpm theme:accent "<your brand colour>"   # a hex value or an OKLCH colour; --dry-run to preview
```

It sets the accent for light and dark at the lightness that passes WCAG AA, in `src/app-config/accent.css` (your
file: `src/index.css` imports it after the kit's tokens, and `kit:update` never touches it); `vp test` rechecks every
contrast pair.

## Blocks

Ready-made molecules, organisms and page templates, built from the kit's components:

```bash
pnpm kit:add                 # search the catalogue and pick
pnpm kit:add system-pages    # or add by name (its dependencies come too)
pnpm kit:remove system-pages
```

A block lands in `src/blocks/<id>/` with its English and Arabic copy, its pages join the router through
`src/blocks/index.ts`, and `pnpm kit:update` keeps it current like the rest of the kit. Blocks come from the kit
version your app has, so run `pnpm kit:update` first when `kit:add` asks you to. In an app made before blocks existed,
`kit:add` lists the few lines its router, menu and `tsconfig.app.json` still need.

## Everyday commands

```bash
vp check          # format, lint, type check
vp test           # unit tests (Vitest)
vp build          # production build
pnpm ds:baseline  # design-system guard: only semantic tokens
pnpm a11y:audit   # axe (WCAG A/AA) over every page, light/dark × en/ar
pnpm bundle:report -- --budget starter   # first-load JS per route; fails over budget, on a page error or an untranslated key
```

The last two drive headless Chromium: run `pnpm exec playwright install chromium` once.

## Staying up to date with the kit

The components, hooks, styles and checks came from the RSK kit, and `kit.lock.json` records which version. When the kit
improves:

```bash
pnpm kit:status    # what changed in the kit, and what you changed yourself
pnpm kit:update    # take the kit's changes (add paths to take only some, --dry-run to preview)
```

Files you never touched are updated. Files only you changed are kept. When a kit file's content already matches the
kit and only its record in `kit.lock.json` changes, `kit:update` lists it as recorded in the lock only. Files changed on both sides are merged; if your
change and the kit's touch the same lines, the file gets `<<<<<<<` markers to resolve. Your pages, routes, layouts,
API code and translations are never touched. If the kit's dependencies changed, the command prints the `pnpm add`
line to run. When a release also changes files that are yours (`package.json`, `vite.config.ts`, `src/index.css`,
the `theme:accent` script), `kit:update` never overwrites them: it ends with the steps still to take under "To finish
this update", and `kit:status` lists the same until each is done.

### Kit files your app changes

Some kit files are yours to fill: `kit:status` lists your changes to them as expected, not as unexplained.

- `src/lib/hooks/queries/index.ts`: export your query hooks
- `src/lib/hooks/mutations/index.ts`: export your mutation hooks
- `src/assets/icons/index.ts`: export your own icons
- `src/app-config/accent.css`: your brand accent (`pnpm theme:accent`); not a kit file at all

Any other change to a kit file is unexplained until you record why:

```bash
pnpm kit:accept src/components/ui/card/Card.tsx --reason "DEMO-12: tighter padding until the kit has a density option"
```

`kit.lock.json` keeps the reason (`accepted`), and `kit:status` lists the file with it and ends with
`Unexplained changes to kit files: none.` Change the file again and it is unexplained again. In an app made before
`kit:accept` existed, run `pnpm tsx scripts/kit/kit.ts accept …` until `kit:update` has brought the new updater.

A kit file you delete on purpose is recorded the same way, for example the mock sign-in's test once your own API signs
users in: `pnpm kit:accept tests/a11y/demo-session.test.ts --reason "DEMO-31: sign-in goes through our API"`.
`kit:status` lists it as deleted, `kit:update` leaves it deleted (and says so), and it is unexplained again if it comes
back or the kit changes it.

### Roles

The session's user (`useAuth().currentUser`) has an optional `roles` list: fill it from your sign-in response
(`src/api/handlers/auth.ts`) to show or hide parts of the screen. It is never authorization: your API checks every
request.

### A defect in the kit

Fix a kit defect in the kit, not in your copy: report it as the kit's `CONTRIBUTING.md` says
(https://github.com/mohammadsafia/rsk/blob/main/CONTRIBUTING.md), then take the fix with `pnpm kit:update` once it is
published here. If you must work around it first, keep the workaround in your own code where you can, or record the
kit file you change with `kit:accept` and the issue's key, and remove it when the fix arrives.

## Where to add things

- Pages: `src/pages/<area>/<Page>.tsx`
- Routes: `src/routes/router.tsx`, and paths in `src/routes/routes.ts`
- Sidebar and command palette entries: `APP_MENU` in `src/routes/routes.ts` (labels in `src/locales/*/nav.json`)
- Copy: a namespace per area in `src/locales/{en,ar}/<area>.json`
