# Technical debt

This document tracks known technical debt and code smells in the MDX docs system. It is intentionally practical: what
the issue is, why it matters, and what a safe fix looks like.

> 2026-10-16: the old components gallery page and its `gallery/` folder were replaced by the dev-only `/docs` site, and their debt items were removed with them.

## Scope

- Docs site (`/docs`, dev-only): `layouts/docs-layout`, `pages/docs`, `component-docs/blocks`
- Registry (`component-docs/registry/`)
- CLI generator (`pnpm docs:new`)
- Linter (`pnpm docs:lint`)

## Non goals

- rewriting the entire docs system
- changing behavior without an explicit requirement
- large refactors without tests or profiling

## Table of contents

1. [Guiding rules](#guiding-rules)
2. [Progress on previous debt](#progress-on-previous-debt)
3. [Top priorities](#top-priorities)
4. [Registry](#registry)
5. [CLI generator](#cli-generator)
6. [Linter](#linter)
7. [Cross cutting improvements](#cross-cutting-improvements)
8. [Suggested milestones](#suggested-milestones)
9. [How to verify changes are safe](#how-to-verify-changes-are-safe)
10. [Summary](#summary)

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

- **Registry types for MDX load** — `registry/types.ts` now defines `DocComponent`, `ComponentDocEntry`, `Frontmatter`,
  and `MdxModule` as shared types

## Top priorities

If you only fix a few things, start here

1. Share `REQUIRED_FRONTMATTER_KEYS` and `normalizeCategoryKey` between registry and linter

## Registry

### Runtime registry does not enforce duplicate ids

Problem

Registry does not detect duplicate ids at runtime. Linter catches it, but runtime can still behave unpredictably if lint
is skipped.

Why it matters

Selection can break or become unstable. Duplicate ids make list rendering and selection rules unreliable.

Safe fix

- during registry build

  - track seen ids
  - push an error into `componentDocsErrors` when duplicates are found

- keep linter as the strict gate, but add runtime guardrails

### Category inference is coupled to path shape

Problem

Folder category inference uses `parts[1]` from a glob path split by `/`, which assumes the glob starts with `../`.

Why it matters

Refactoring folder structure or moving the registry can silently break category inference.

Safe fix

- make the rule explicit and documented

  - the second segment of the glob path (after `..`) is the category folder

- implement a small helper and test it

### Required frontmatter duplicated across registry and linter

Problem

Both `registry/registry.dev.ts` and `scripts/lint.ts` define `REQUIRED_FRONTMATTER_KEYS` separately with the same
values.

Why it matters

Drift risk. Tools can disagree and enforcement becomes inconsistent.

Safe fix

- define shared constants in one file and import in both

  - `src/component-docs/shared/frontmatter.ts`

- keep runtime validation lightweight, linter strict

## CLI generator

### Editor auto-open behavior is platform dependent

Problem

Opening relies on PATH and editor launcher availability. The CLI tries WebStorm, VS Code, `xdg-open`, and `open` in
order.

Why it matters

Teammates may think generation failed when only the auto-open failed.

Safe fix

- always print the created file path at the end (even if open succeeded) — **partially done**: the CLI prints the path
  on failure but not on success
- improve error message when open fails

### Tags generation can become noisy

Problem

Tags include folder, id, id parts, plus extras. This can generate too many tags.

Why it matters

Tag UI becomes cluttered and people stop trusting tags.

Safe fix

- keep folderLower and id parts
- drop the full id tag unless you intentionally want it for search
- cap auto tags and rely on explicit tags for intent

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

- standardize placeholders to a single marker format

  - `__TPL__SOMETHING__`

- detect using one regex
- update template accordingly

### Frontmatter parsing error messaging is generic

Problem

Schema validation is strict (Zod), but on failure the linter only reports `invalid frontmatter` without specifics.

Why it matters

Debugging is slower than it needs to be. Authors cannot tell which field failed or why.

Safe fix

- include Zod error paths in output
- show which key failed and why

### Linter does not exclude `docs` folder

Problem

The linter only skips `_*` directories. The `scripts` and `docs` folders are not excluded. If an `.mdx` file were added
to `docs/`, it would be linted as a component doc.

Why it matters

Unexpected lint failures for non-component MDX files placed in utility folders.

Safe fix

- add `docs` to the exclusion list alongside `_*` in `listMdxFiles`

## Cross-cutting improvements

### Add unit tests for invariants

Targets

- category resolution rules in `registry/registry.dev.ts`
- selection fallback in `useSelectedDoc`
- auto-switch category behavior in `useAutoSwitchCategoryOnEmptySearchResults`

Why it matters

Enables safe refactors without breaking behavior. The pure functions in `utils.tsx` are already testable without React.

Suggested approach

- test hooks with `@testing-library/react` renderHook if needed

### Shared normalization utilities

Problem

`normalizeCategoryKey` is defined in both `registry/registry.dev.ts` and `scripts/lint.ts` with the same logic.

Safe fix

- centralize normalization logic in one shared file used by

  - registry
  - linter
  - generator

## Suggested milestones

### Milestone 1 (safe refactor, no behavior change)

- share `REQUIRED_FRONTMATTER_KEYS` and `normalizeCategoryKey` across registry, linter, and generator

### Milestone 2 (reduce coordination complexity)

- reduce `useEffect` coordination by using explicit event transitions
- keep only essential bootstrapping effects

### Milestone 3 (optional performance improvements)

- precompute search index per doc
- reduce intermediate array allocations in grouping
- only after profiling

## How to verify changes are safe

After any refactor, verify

- category tabs show correct counts
- searching filters results and keeps sorting stable
- tag filtering only affects active category
- selection stays stable when possible and falls back to first visible doc when not
- when search makes current category empty, category auto switches and clears tags
- `componentDocsErrors` still renders when registry reports issues
- UI tab always defaults to first tab (with UI pinned first)

## Summary

- Several structural items from the original debt list have been resolved (module split, component extraction, registry
  types)
- The biggest remaining risk is effect-driven coordination without tests
- Most other debt becomes easy once invariants are test covered
