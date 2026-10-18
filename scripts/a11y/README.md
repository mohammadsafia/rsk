# Accessibility audit

```bash
pnpm a11y:audit                                   # starts the dev server if nothing answers on :5173
pnpm a11y:audit -- --base http://localhost:4173   # audit another running server (e.g. vp preview)
pnpm a11y:audit -- --max 50                       # cap how many pages are discovered
```

Runs [axe-core](https://github.com/dequelabs/axe-core) with the WCAG 2.0 / 2.1 / 2.2 A and AA rules over every page the
app links to, in light and dark, English and Arabic (with reduced motion, so pages are measured at rest).

- **Pages** are found by following same-site links from `/` (and from wherever `/` redirects to), so the kit audits its
  docs and showcase pages and an app made from the starter audits its own routes. A page linked from nowhere isn't audited; link it, or start the audit from it
  with `--base`.
- **Output:** a per-rule summary on the console, and the full report in `a11y-report.json` (git-ignored). When `--max`
  stops discovery early, the console says so and the report has `"truncated": true`.
- **Exit code:** non-zero when any violation is found or a page fails to load, so it can gate CI.

Needs Playwright's Chromium once: `pnpm exec playwright install chromium`.
