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

## Your brand colour

```bash
pnpm theme:accent "<your brand colour>"   # a hex value or an OKLCH colour; --dry-run to preview
```

It sets the accent for light and dark at the lightness that passes WCAG AA, in `src/styles/tokens.css`; `vp test`
rechecks every contrast pair.

## Where to add things

- Pages: `src/pages/<area>/<Page>.tsx`
- Routes: `src/routes/router.tsx`, and paths in `src/routes/routes.ts`
- Sidebar and command palette entries: `APP_MENU` in `src/routes/routes.ts` (labels in `src/locales/*/nav.json`)
- Copy: a namespace per area in `src/locales/{en,ar}/<area>.json`
