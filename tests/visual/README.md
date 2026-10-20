# Screenshot tests

```bash
pnpm visual:test     # compare every component against its baseline
pnpm visual:update   # accept the new look after an intended change, then commit the PNGs
```

Each component docs page's first example is shot as **light / English** and **dark / Arabic**, which covers both
themes and both directions. The test starts its own dev server on :5180 (the docs exist only in development), fixes
the clock at 2026-10-13 10:30, turns animations off and waits for fonts, so a shot changes only when the component
does. A failure writes the expected, actual and diff images to `visual-report/` (`npx playwright show-report
visual-report`).

Baselines live in `__screenshots__/<platform>/`: font rendering differs between macOS and Linux, so each platform keeps
its own. They were recorded on macOS; for CI on Linux, record a `linux/` set there once with `pnpm visual:update`.

A changed screenshot is a review, not a chore: look at the diff before you accept it.
