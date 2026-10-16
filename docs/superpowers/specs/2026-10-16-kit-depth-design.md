# Kit depth: shared, charts, wizard and scheduler — design

**Status:** approved in brainstorming (2026-10-16), pending written-spec review
**Branch:** `feat/ui-kit-composites`
**Follow-up:** 2 of 3. Follow-up 3 builds five example pages from what this spec adds.

## Goal

Make the UI kit cover what real business pages need. Capabilities are chosen by the five example pages of follow-up 3, so nothing here is speculative:

| Page | Needs from this spec |
|---|---|
| Appointments scheduler | Calendar create / move / resize, resource columns, all-day row, agenda view, Sheet |
| Patient profile | PageHeader media + meta, Timeline, StatCard, Sheet |
| Billing / invoices | DataTable bulk selection + action bar, Money |
| Operations dashboard | StatCard with trend + sparkline, charts |
| New patient intake | FormWizard |

## Global constraints

- Semantic tokens only; the forbidden-pattern baseline stays `{}`. No coloured side stripes. Every field keeps Input's height.
- English and Arabic for all copy (`src/locales/{en,ar}`), RTL-correct layout (logical properties, mirrored directional icons, LTR-isolated values, Western digits).
- Every new component ships with tests (TDD) and a docs page with the enforced anatomy: titled `<Example>`s, `PropsTable` API, Accessibility, RTL notes. `docs:lint` and the render-all test must pass.
- The docs site stays dev-only; nothing in this spec may make production import `@component-docs/*`.
- Existing public APIs keep working: every change to `CalendarGrid`, `DataTable` and `PageHeader` is additive and optional.
- New dependency: `recharts` (v3) only. No drag-and-drop library.

## Work order

Four plans, executed in order. Each ends with tested components and their docs pages.

1. **Plan A — overlays and data display:** Sheet, StatCard, Timeline, Money, DataTable bulk selection, PageHeader enrichment.
2. **Plan B — charts:** `@components/charts` on recharts.
3. **Plan C — FormWizard.**
4. **Plan D — calendar scheduler.**

---

## Plan A — overlays and data display

### Sheet (`@components/ui`)

- Side panel on Radix Dialog. `side: 'end' | 'start'` (logical, default `end`), `size: 'sm' | 'md' | 'lg'` (384 / 512 / 720 px). Below `md` it becomes a bottom sheet.
- Parts: `Sheet`, `Sheet.Trigger`, `Sheet.Content` (required `title`, optional `description`, `hideTitle`), `Sheet.Header` (sticky), body (scrolls), `Sheet.Footer` (sticky, actions end-aligned), `Sheet.Close`.
- Focus is trapped and returns to the trigger. Escape and the scrim close it unless `dismissible={false}`.
- RTL: `side="end"` slides in from the left in Arabic.

### StatCard (`@components/shared`)

- Props: `label`, `value` (ReactNode; usually `Money` or a formatted number), `trend?: { value: number; direction?: 'up' | 'down'; positive?: 'up' | 'down' }`, `caption?` (e.g. "vs last week"), `sparkline?: ReactNode` (filled by Plan B's `Sparkline`), `loading?`, `href?` (whole-card link), `icon?`.
- The value is mono, tabular, LTR-isolated. The trend shows an arrow and signed percentage. Its tone is success when the movement matches `positive` (default `up`) and danger otherwise. The arrow is decorative; the trend has an `aria-label` like "up 12.4% vs last week".
- Works inside `CardGrid`.

### Timeline (`@components/shared`)

- `Timeline` renders an `ol`; `Timeline.Item` has `icon | avatar`, `tone?`, `title`, `meta?` (actor), `time` (DateInput), and optional children for body content.
- Items sit on a hairline rail with a dot or avatar marker (no coloured stripe). Time shows relative ("2h ago") with the full date in a tooltip and a `<time dateTime>`.
- `Timeline.Group` adds a date heading ("Today", "Yesterday", formatted date) for grouped feeds; a `groupByDay(items, getTime)` helper is exported.
- States: `loading` (skeleton rows), `empty` (EmptyState), and `onLoadMore` / `hasMore` for a "Load more" button.

### Money (`@components/ui`)

- `<Money value currency? compact? negative?="sign" | "parentheses" tone?="auto" | "none" />`.
- Formats with `Intl.NumberFormat` (`-u-nu-latn`, Western digits) for the app language. The whole value is LTR-isolated, tabular mono.
- `tone="auto"` colours negative amounts `danger`. `compact` gives "12.4K". `currency` defaults to an app setting (`APP_CONFIG.currency`, added) and accepts any ISO code.
- A `formatMoney(value, options, language)` util backs it and is reused by charts and StatCard.

### DataTable bulk selection (`@components/tables`)

- `createSelectionColumn<TData>()` returns a pinned-start column with a header checkbox (checked / indeterminate / unchecked for the current page) and row checkboxes. Each checkbox is labelled ("Select all on this page", "Select row INV-…" via `getRowLabel`).
- When the whole page is selected, a "Select all N results" link selects every filtered row. Selection is keyed by `getRowId`, so it survives paging, sorting and filtering.
- `DataTable.BulkActions` replaces the toolbar while any row is selected. It shows "3 selected" (pluralised), then children (action buttons, which receive the selected rows through a render prop), then Clear. The count change is announced in a polite live region.
- Escape clears the selection while focus is inside the table.

### PageHeader enrichment (`@components/shared`)

- New optional `media` (Avatar or icon, before the title) and `meta` (ReactNode under the description: badges and dot-separated key/value items).
- Mobile: media and title share a row; actions wrap below. Existing props are unchanged.

---

## Plan B — charts (`@components/charts`)

- Components: `LineChart`, `AreaChart` (`stacked?`), `BarChart` (`orientation`, `stacked?`), `DonutChart` (`centerLabel`, `centerValue`), `Sparkline` (no axes; `tone`).
- Shared API: `data`, `series: { key, label, tone? }[]`, `x: { key, format? }`, `valueFormat?` (`'number' | 'percent' | 'money' | (v) => string`), `height?` (default 280; Sparkline 32), `loading?`, `empty?`, `aria-label` (required: one-line summary).
- **Tokens:** a categorical palette `--chart-1` … `--chart-6` in `tokens.css` for light and dark (chart-1 = accent), exposed in `theme.css`. Each colour is added to `contrast.test.ts` at ≥3:1 against `surface`. Grid uses `border-subtle`, axis text `fg-muted`, tooltip the raised surface. Colours are CSS variables, so dark mode needs no JS.
- **Formatting:** values through `formatMoney` / `useNumberFormat` and dates through `useDate` in the app language; series labels come from the caller (already translated).
- **RTL:** in Arabic the category/time axis is reversed and the value axis sits on the right; legend and tooltip follow the reading direction; numbers stay LTR-isolated.
- **Interaction:** a kit tooltip (dot, label, value per series). Clicking a legend item toggles that series (`aria-pressed`); at least one series stays visible.
- **Accessibility:** recharts `accessibilityLayer` (arrow keys between points). A "View as table" toggle swaps the chart for a `Table` of the same data. Animation is off under `prefers-reduced-motion`.
- **States:** a skeleton while loading, EmptyState when `data` is empty. Charts are responsive to their container.
- **Loading:** the family is imported from `@components/charts` only. Pages are already lazy routes, so recharts stays out of pages that don't chart. The barrel must not be re-exported from `@components/ui` or `shared`.

---

## Plan C — FormWizard (`@components/forms`)

```tsx
<FormWizard form={form} onSubmit={save} draftKey="intake" urlSync>
  <FormWizard.Step id="patient" title="Patient" schema={patientSchema}>…</FormWizard.Step>
  <FormWizard.Step id="insurance" title="Insurance" schema={insuranceSchema} optional>…</FormWizard.Step>
  <FormWizard.Step id="documents" title="Documents">…</FormWizard.Step>
  <FormWizard.Review />
</FormWizard>
```

- One react-hook-form instance across steps; FormWizard renders a `FormContainer`.
- **Indicator:** the existing `Stepper` (horizontal on desktop; "Step 2 of 4 · Insurance" on mobile). Statuses are derived: `done`, `current`, `error` (a passed step now invalid), `next`.
- **Navigation:** Next validates only the current step (`schema` parsed against the step's values, or `form.trigger` on the fields registered inside the step) and focuses the first error. Back never validates. Completed steps are clickable; later steps are locked until earlier ones are valid. Optional steps show Skip. `condition={false}` hides a step.
- **Review:** `FormWizard.Review` lists each step's values as a `DescriptionList` (labels from the fields' `label`), each step with an Edit link. A step can pass `review={(values) => …}` to customise its summary.
- **Draft:** with `draftKey`, values (minus `File` objects) are saved, debounced, to sessionStorage `rsk:wizard:<key>`. On return a "Draft restored · Discard" notice shows. The draft clears on successful submit or Discard.
- **Submit:** the last step's primary button reads Submit and shows loading. If `onSubmit` throws a field error map (`{ field: message }`), the errors are set and the wizard jumps to the first step owning an errored field.
- **Leaving:** a dirty wizard reuses the `confirmOnCancel` dialog.
- **URL:** `urlSync` keeps `?step=<id>` through nuqs, so refresh and browser Back move between steps (still respecting locks).
- **A11y / RTL:** the step heading receives focus on change; "Step 2 of 4, Insurance" is announced politely. The Stepper and Next/Back arrows mirror in Arabic.

---

## Plan D — calendar scheduler (`CalendarGrid`)

All additions are optional props or sub-components; current usage is unchanged.

### Resources

- `resources?: { id: string; label: string; avatar?: string }[]` and `eventAccessors.getResourceId?`.
- **Day view:** one column per resource with a sticky header (avatar + name), its own events and availability. `slots` may be keyed by resource: `Record<resourceId, Record<isoDate, TimeRange[]>>`.
- **Week view:** `resourceFilter` (a Select in the header) shows one resource at a time.
- Many resources scroll horizontally while the time axis stays pinned.

### Create (slot selection)

- Click an empty cell, or press and drag across cells, to draw a ghost block snapped to `stepMinutes`. Release calls `onSlotSelect({ start, end, resourceId })`.
- Unavailable cells refuse selection unless `allowOutsideAvailability`. Escape cancels. A press that moves under 4px is a click.

### Move and resize

- Drag an event body to move it (time, day, resource; duration kept) or its bottom edge to resize it, snapped to the step, with a live "10:30 – 11:15" label.
- On drop: `onEventChange({ event, start, end, resourceId }) => Promise<void>`. The grid renders the new position optimistically and reverts, with a toast, if the promise rejects.
- `canEdit?(event)` locks events (e.g. past). Moves under 4px are clicks, so popovers still open.
- Implementation: pointer events with `setPointerCapture`, auto-scroll near the scroller edges, the same code path for mouse, pen and touch (`touch-action` handled). No drag library.

### Keyboard

- Event cards are focusable. Enter opens the popover; `M` starts a move and `R` a resize. Arrow Up/Down change the time by one step; Arrow Left/Right change the day or resource (mirrored in Arabic). Enter commits and Escape cancels.
- Empty cells are reachable with arrow keys (a roving tabindex on the grid). Enter on a cell calls `onSlotSelect` for one step.
- Each change is announced politely ("Moved to Fri 16 Oct, 10:30 to 11:00, Dr. Haddad").

### All-day row

- Events where `eventAccessors.isAllDay?(event)` is true, or that span midnight or several days, render in a strip above the time grid in day and week views, packed into lanes. More than 3 lanes collapse to "+N more" (popover).

### Agenda view

- `view="agenda"` (and `<CalendarGrid.AgendaView />`): a list grouped by day ("Today · Fri 16 Oct") with time, title and resource, reusing `EventTemplate` and `PopoverTemplate`; empty days are omitted, with an empty state for an empty range. Navigation pages by `agendaDays` (default 7). `ViewTabs` gains Agenda.
- The existing `viewMode="list"` keeps working.

### Correctness

- Overlap lanes stay as today, computed per resource.
- All interaction maths runs in local wall time from the app's date utilities, so DST shifts don't move events.
- RTL: columns, lanes, drag directions and keyboard arrows mirror.

---

## Testing

- Unit tests per component (happy-dom): behaviour, keyboard, ARIA, RTL classes, i18n (EN/AR).
- Calendar interactions: pure functions for snapping, hit-testing, lane packing and range maths are unit-tested directly. Pointer flows are tested with synthesised pointer events. A browser check per drag flow runs in the docs at 1440 px and 390 px (touch emulation).
- Charts: rendering with mocked `ResizeObserver`, the table fallback, the legend toggle, RTL axis reversal, token colours (no hex).
- Contrast tests for the new chart tokens. The forbidden-pattern baseline stays `{}`.
- Each plan ends with the full gate: `ds:baseline`, `vp fmt`, `vp check`, `tsc -b`, `tsc -p tsconfig.scripts.json`, `docs:lint`, `vp test --run src tests`, and `vp build` (docs still absent from `dist`).

## Out of scope

- Recurring events (RRULE), drag between calendars or from an external list, printing, a horizontal resource timeline.
- Chart zoom / brush, scatter and radar charts, streaming data.
- Branching step graphs and server-side drafts in the wizard.
- The five example pages themselves (follow-up 3).
