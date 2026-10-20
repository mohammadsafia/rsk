# Screenshot tests

```bash
pnpm visual:test     # compare every component against its baseline
pnpm visual:update   # accept the new look after an intended change, then commit the PNGs
```

Every component docs page is shot as **light / English** and **dark / Arabic**, which covers both themes and both
directions:

- its first example (tables, calendars and charts in a wider window, so no column is cropped);
- for overlays (dialog, sheet, popover, menu, select, combobox, tooltips, toasts), the open panel rather than the
  closed trigger;
- for the core controls (button, input, checkbox, switch, tabs, radio group), the keyboard focus ring.

The examples' own content is mostly English, so the Arabic shots check direction and the kit's own strings more than
Arabic typography.

**Stable by design.** The test starts its own dev server on :5181 (never another one left running), fixes the clock at
2026-10-13 10:30, turns animations off, waits for fonts and serves any internet image from a local file. Unchanged code
differs by 0 pixels from run to run, so the tolerance is tight. A pixel may shift by at most 0.05 in colour, and at most
2 pixels may differ: a button's corner radius going from 6 to 8px fails, and so does a subtle fill change. A failure
writes the expected, actual and diff images to `visual-report/` (`npx playwright show-report visual-report`).

**Per platform.** Font rendering differs between macOS and Linux, so baselines live in `__screenshots__/<platform>/`.
The committed set is macOS. To run them in CI, record the Linux set once with the `visual` workflow (Actions → visual →
"record"), commit the downloaded `linux-baselines` under `__screenshots__/linux/`, and enable its pull_request trigger.

A changed screenshot is a review, not a chore: look at the diff before you accept it.
