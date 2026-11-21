# Contributing to RSK

RSK is the kit every app made from `rsk-starter` or `rsk-next-starter` takes its components, hooks, styles and checks
from. A defect found in an app is fixed here, once, and reaches every app through `pnpm kit:update`.

## A project found a defect in the kit

1. **Check it is the kit's.** The file is a kit file when `kit.lock.json` lists it (`src/components/`, `src/lib/`,
   `src/styles/`, `scripts/kit/` and the other kit folders). Run `pnpm kit:status` first: if the app changed the file,
   check the defect is not in that change.
2. **Report it here** as a GitHub issue on `mohammadsafia/rsk`, titled with the component and what goes wrong
   ("Sheet: focus lost when opened by state"). Write:
   - what a person does and sees (keys pressed, language, screen width), and what they should see;
   - the kit version (`kit` in `kit.lock.json`) and the starter (Vite or Next);
   - the smallest code that shows it, without the project's own data or names;
   - the project's own issue key, so the two can be linked.
3. **Keep the workaround small and findable** until the fix arrives: in the app's own code where possible. If a kit
   file must change, record it with `pnpm kit:accept <file> --reason "<project key>: workaround for rsk#<n>"`, so
   `kit:status` names it and the reason.
4. **Take the fix.** When the pull request here is merged, the starter sync publishes it. In the app:
   `pnpm kit:update` (it updates itself first), run the app's tests, remove the workaround, and check that
   `pnpm kit:status` shows the file back to the kit's version. The pull request's "Changes behaviour" section says what
   an app must change.

## Changing the kit

- **A test first.** Every change in behaviour comes with a test that fails without it: write the test, watch it fail
  for the reason the defect gives, then fix. Name the defect in the test's comment in general terms, without a
  project's data.
- **At the level where it fails.** A fault that shows only in a real browser (focus, the keyboard, layout, a popover
  inside a sheet) is tested in a real browser: a Playwright test in `tests/visual/` tagged `@behaviour`, with no
  screenshot. A simulated DOM test that passes on the broken code is not the test. The `browser` workflow runs every
  `@behaviour` test on each pull request (`pnpm browser:test` locally; `PW_CHANNEL=chrome` uses an installed Chrome).
- **One defect per commit**, its message saying what was wrong and why the fix is right.
- **Keep public APIs.** A component's props and exports do not change in a breaking way. Where a default changes what
  an app sees or does, the pull request says so under a **Changes behaviour** heading, with what an app does about it.
- **Docs with the code.** A component's page in `src/component-docs/` documents a new prop or a changed default in the
  same pull request.

Before opening the pull request:

```bash
vp check                              # format, lint, types
vp test run                           # the tests (a few need Chromium: pnpm exec playwright install chromium)
pnpm docs:lint                        # the component docs
pnpm starter:verify                   # the Vite starter: built, installed offline, checked, tested, built
pnpm starter:verify -- --target next  # the Next starter, served and walked through in a browser
```

CI runs the first three on every pull request (`.github/workflows/checks.yml`) and verifies both starters
(`starter-verify.yml`). On `main`, `starter-sync.yml` publishes each starter only after it verifies.
