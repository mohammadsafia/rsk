# Technical debt

This document tracks known technical debt and code smells in the MDX docs system. It is intentionally practical: what
the issue is, why it matters, and what a safe fix looks like.

## Scope

- Components Gallery page (`ComponentsGalleryPage` / docs browser UX)
- Gallery internals (`component-docs/gallery/`)
- Registry (`component-docs/registry/`)
- CLI generator (`yarn docs:new`)
- Linter (`yarn docs:lint`)

## Non goals

- rewriting the entire docs system
- changing behavior without an explicit requirement
- large refactors without tests or profiling

## Table of contents

1. [Guiding rules](#guiding-rules)
2. [Progress on previous debt](#progress-on-previous-debt)
3. [Top priorities](#top-priorities)
4. [Components Gallery page](#components-gallery-page)
5. [Registry](#registry)
6. [CLI generator](#cli-generator)
7. [Linter](#linter)
8. [Cross cutting improvements](#cross-cutting-improvements)
9. [Suggested milestones](#suggested-milestones)
10. [How to verify changes are safe](#how-to-verify-changes-are-safe)
11. [Summary](#summary)

Use this doc by starting with Top priorities, then jumping to the relevant section.

## Guiding rules

When working on debt here, prioritize

- preserve existing behavior unless explicitly changing it
- keep refactors incremental and reviewable
- introduce pure helpers before touching UI state or effects
- avoid clever abstractions, prefer straightforward code
- profile before optimizing performance hotspots

## Progress on previous debt

These items from the original debt list have been resolved:

- **Monolithic module** — the gallery page has been split into `component-docs/gallery/` with dedicated files:
  `hooks.ts`, `utils.tsx`, `types.ts`, `sidebar-panel/SidebarPanel.tsx`, `doc-panel/DocPanel.tsx`
- **Rendering helpers as functions** — `SidebarPanel` and `DocPanel` are now proper components driven by typed props
  (`SidebarPanelProps`, `DocPanelProps`)
- **Registry types for MDX load** — `registry/types.ts` now defines `DocComponent`, `ComponentDocEntry`, `Frontmatter`,
  and `MdxModule` as shared types
- **Gallery file split** — completed, though the actual location is `component-docs/gallery/` (not
  `pages/components/gallery/` as originally suggested)

## Top priorities

If you only fix a few things, start here

1. Reduce effect-driven state coordination in the gallery hooks (4 `useEffect` hooks remain)
2. Extract filtering logic into pure functions separate from hooks (testable without React)
3. Fix remaining `any` in `DocPanelProps.SelectedDocComponent` (`LazyExoticComponent<ComponentType<any>>`)
4. Share `REQUIRED_FRONTMATTER_KEYS` and `normalizeCategoryKey` between registry and linter
5. Add unit tests for pure selectors in `gallery/utils.tsx`

## Components Gallery page

### Effect-driven coordination

Problem

Four `useEffect` hooks in `gallery/hooks.ts` coordinate related state:

* `useInitSelectedDocId` — init selection from first tab
* `useAutoSwitchCategoryOnEmptySearchResults` — switch category when search empties current tab
* `useEnsureActiveCategoryExists` — reset to first tab if active tab disappears
* `useEnsureSelectedDocIsVisible` — reset selection if selected doc is no longer in filtered list

Why it matters

Ordering constraints are implicit. This can create subtle loops and selection flicker, and makes new filters risky to
add.

Safe fix

* centralize transitions

    * compute next state in one reducer-like function
    * update state in response to explicit events

        * category click
        * search change
        * tag toggle
* keep effects only for

    * initial bootstrapping
    * reacting to registry changes (rare)

### Derived state spread across hooks

Problem

Derived values are computed across multiple hooks (`useDocsGroupedByCategory`, `useDocsFilteredBySearchTextByCategory`,
`useDocsInActiveCategory`, `useAvailableTagOptions`, `useDocsFilteredByActiveTags`, `useSelectedDoc`,
`useSelectedDocComponent`) and composed in the page.

Why it matters

Future edits can accidentally break invariants (counts, selection fallback, tab switching). The composition order in the
page component must be correct for the pipeline to work.

Safe fix

* create a single view model builder

    * takes primitive state plus registry docs
    * returns all derived collections and counts
* keep invariants explicit in one place

### Filtering and grouping creates many arrays

Problem

Grouping uses `by.set(key, [...list, doc])` which creates a new array for every doc. Search filtering flattens all
categories and re-groups.

Why it matters

Fine for small registries, but can degrade with many docs due to allocations and GC churn.

Safe fix

* build mutable arrays internally, freeze at the end

    * `Map<string, ComponentDocEntry[]>` while building
    * convert to readonly arrays once
* only do this if profiling shows it matters

### Remaining `any` in DocPanelProps

Problem

`DocPanelProps` in `gallery/types.ts` still uses:

```ts
SelectedDocComponent: LazyExoticComponent<ComponentType<any>> | null;
```

Why it matters

`any` hides incompatibilities. If MDX docs ever expect props, mistakes will slip through.

Safe fix

* use `DocComponent` from `registry/types.ts` which is already `ComponentType<Record<string, unknown>>`

    * `SelectedDocComponent: LazyExoticComponent<DocComponent> | null;`

## Registry

### Runtime registry does not enforce duplicate ids

Problem

Registry does not detect duplicate ids at runtime. Linter catches it, but runtime can still behave unpredictably if lint
is skipped.

Why it matters

Selection can break or become unstable. Duplicate ids make list rendering and selection rules unreliable.

Safe fix

* during registry build

    * track seen ids
    * push an error into `componentDocsErrors` when duplicates are found
* keep linter as the strict gate, but add runtime guardrails

### Category inference is coupled to path shape

Problem

Folder category inference uses `parts[1]` from a glob path split by `/`, which assumes the glob starts with `../`.

Why it matters

Refactoring folder structure or moving the registry can silently break category inference.

Safe fix

* make the rule explicit and documented

    * the second segment of the glob path (after `..`) is the category folder
* implement a small helper and test it

### Required frontmatter duplicated across registry and linter

Problem

Both `registry/registry.dev.ts` and `scripts/lint.ts` define `REQUIRED_FRONTMATTER_KEYS` separately with the same
values.

Why it matters

Drift risk. Tools can disagree and enforcement becomes inconsistent.

Safe fix

* define shared constants in one file and import in both

    * `src/component-docs/shared/frontmatter.ts`
* keep runtime validation lightweight, linter strict

## CLI generator

### Editor auto-open behavior is platform dependent

Problem

Opening relies on PATH and editor launcher availability. The CLI tries WebStorm, VS Code, `xdg-open`, and `open` in
order.

Why it matters

Teammates may think generation failed when only the auto-open failed.

Safe fix

* always print the created file path at the end (even if open succeeded) — **partially done**: the CLI prints the path
  on failure but not on success
* improve error message when open fails

### Tags generation can become noisy

Problem

Tags include folder, id, id parts, plus extras. This can generate too many tags.

Why it matters

Tag UI becomes cluttered and people stop trusting tags.

Safe fix

* keep folderLower and id parts
* drop the full id tag unless you intentionally want it for search
* cap auto tags and rely on explicit tags for intent

Only change this if the team agrees on tag strategy.

## Linter

### Placeholder detection is string-based and limited

Problem

Placeholder detection checks for four hardcoded marker strings: `component-id`, `Component Name`,
`RealComponentName`, `Replace these placeholders`.

Why it matters

Template changes can bypass detection. Also possible false positives (e.g. a doc that legitimately mentions
"Component Name").

Safe fix

* standardize placeholders to a single marker format

    * `__TPL__SOMETHING__`
* detect using one regex
* update template accordingly

### Frontmatter parsing error messaging is generic

Problem

Schema validation is strict (Zod), but on failure the linter only reports `invalid frontmatter` without specifics.

Why it matters

Debugging is slower than it needs to be. Authors cannot tell which field failed or why.

Safe fix

* include Zod error paths in output
* show which key failed and why

### Linter does not exclude `docs` folder

Problem

The linter only skips `_*` directories. The `scripts` and `docs` folders are not excluded. If an `.mdx` file were added
to `docs/`, it would be linted as a component doc.

Why it matters

Unexpected lint failures for non-component MDX files placed in utility folders.

Safe fix

* add `docs` to the exclusion list alongside `_*` in `listMdxFiles`

## Cross-cutting improvements

### Add unit tests for invariants

Targets

* `matchesSearchText` and `filterDocsBySearchText` in `gallery/utils.tsx`
* `buildCategoryTabOptions` in `gallery/utils.tsx`
* `countTagsByLabel` in `gallery/utils.tsx`
* category resolution rules in `registry/registry.dev.ts`
* selection fallback in `useSelectedDoc`
* auto-switch category behavior in `useAutoSwitchCategoryOnEmptySearchResults`

Why it matters

Enables safe refactors without breaking behavior. The pure functions in `utils.tsx` are already testable without React.

Suggested approach

* test pure functions in `gallery/utils.tsx` with Vitest using small fixtures (no React needed)
* test hooks with `@testing-library/react` renderHook if needed

### Shared normalization utilities

Problem

`normalizeCategoryKey` is defined in both `registry/registry.dev.ts` and `scripts/lint.ts` with the same logic.

Safe fix

* centralize normalization logic in one shared file used by

    * registry
    * linter
    * generator

## Suggested milestones

### Milestone 1 (safe refactor, no behavior change)

* share `REQUIRED_FRONTMATTER_KEYS` and `normalizeCategoryKey` across registry, linter, and generator
* fix `DocPanelProps.SelectedDocComponent` typing (replace `any` with `DocComponent`)
* add unit tests for pure functions in `gallery/utils.tsx`

### Milestone 2 (reduce coordination complexity)

* reduce `useEffect` coordination by using explicit event transitions
* keep only essential bootstrapping effects

### Milestone 3 (optional performance improvements)

* precompute search index per doc
* reduce intermediate array allocations in grouping
* only after profiling

## How to verify changes are safe

After any refactor, verify

* category tabs show correct counts
* searching filters results and keeps sorting stable
* tag filtering only affects active category
* selection stays stable when possible and falls back to first visible doc when not
* when search makes current category empty, category auto switches and clears tags
* `componentDocsErrors` still renders when registry reports issues
* UI tab always defaults to first tab (with UI pinned first)

## Summary

* Several structural items from the original debt list have been resolved (module split, component extraction, registry
  types)
* The biggest remaining risk is effect-driven coordination without tests
* The best first step is sharing constants, fixing the `any` type, and adding tests for `gallery/utils.tsx`
* Most other debt becomes easy once invariants are test covered