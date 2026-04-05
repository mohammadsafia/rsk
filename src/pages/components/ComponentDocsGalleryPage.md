# ComponentDocsGalleryPage

## Overview

This module renders the Components Gallery page used to browse MDX component docs with category tabs, search, tag
filters,
and a selected-doc viewer panel.

It owns the browsing UX and selection behavior.
It does not own MDX authoring rules, frontmatter schema, lint rules, or registry build behavior.

---

## Table of contents

1. [Responsibility](#responsibility)
2. [Data sources](#data-sources)
3. [UI structure](#ui-structure)
4. [State model](#state-model)
5. [Key invariants](#key-invariants)
6. [Filtering and selection behavior](#filtering-and-selection-behavior)
7. [Extension points](#extension-points)
8. [Checklist for future edits](#checklist-for-future-edits)
9. [Summary](#summary)
10. [Maintenance notes](#maintenance-notes)

---

## Responsibility

This page is responsible for:

- Rendering category tabs and maintaining the active category
- Rendering sidebar search, tag filters, and the doc list
- Rendering the selected doc header and lazy-loading the MDX doc component
- Surfacing registry validation issues (`componentDocsErrors`) in the UI
- Enforcing predictable selection behavior when filters change

Non-goals:

- Defining MDX authoring standards and frontmatter schema
- Implementing registry discovery, category inference, or validation rules
- Owning global design tokens or shared style primitives

---

## Data sources

Inputs:

- `getComponentDocsRegistry()`
    - returns a cached list of docs: `ReadonlyArray<Readonly<ComponentDocEntry>>`
- `componentDocsErrors`
    - registry validation errors collected during registry build
- `normalizeCategoryKey()`
    - canonicalizes category keys used for grouping, filtering, and tab labels

Expected `ComponentDocEntry` fields used here:

- `id`
    - stable unique identifier used for selection
- `title`
    - display label in the sidebar and header
- `category`
    - used for category grouping (normalized)
- `description`
    - displayed in sidebar item and header
- `tags?`
    - used for search indexing and tag filter chips
- `load()`
    - async import factory used by `React.lazy`

All entries are treated as immutable (`readonly`) by this module.

---

## UI structure

High-level layout:

- Page header (title + subtitle)
- Category tab row (shows count per category)
- Two-column grid
    - `SidebarPanel`
        - active category label and counts
        - search input
        - tag filter chips
        - scrollable doc list
    - `DocPanel`
        - shows `componentDocsErrors` if any
        - selected doc header (title, description, tags)
        - MDX content rendered via `DocsLayout` and `MDXProvider`

MDX rendering:

- `MDXProvider` overrides:
    - `pre` blocks render via `<CodeBlock />`
- Selected MDX module is lazy-loaded and rendered under `Suspense`

---

## State model

Owned state (React state in the page):

- `searchText`
    - global search query string
- `activeCategoryKey`
    - current tab category key (normalized)
- `activeTagSet`
    - selected tags for filtering within the active category
- `selectedDocId`
    - currently selected doc id (sidebar selection)

Derived data (computed via memos/hooks):

- `categoryTabOptions`
    - unique normalized category tabs
    - sorted alphabetically
    - `UI` pinned first when present
- `docsByCategory`
    - `Map<string, ReadonlyArray<ComponentDocEntry>>`
    - grouped by normalized category
- `docsByCategoryFiltered`
    - same `Map` shape, after applying search to all docs and regrouping
- `docsInActiveCategory`
    - unsearched list in the active category (used to compute available tags)
- `availableTagOptions`
    - `[{ tag, count }]` derived from docs in active category
- `filteredDocsInActiveCategory`
    - docs visible in the active category after applying:
        - search (global)
        - tag filtering (active category only)
- `selectedDoc`
    - the selected doc entry, or fallback to the first visible doc
- `SelectedDocComponent`
    - `React.lazy(selectedDoc.load)` for the current selection

---

## Key invariants

These behaviors are relied on by users and should not change accidentally:

- Category tabs are deterministic, with `UI` pinned first when present
- Filtering order is deterministic:
    - search is applied first across all docs
    - results are regrouped by category
    - tags filter applies only inside the active category
- If `selectedDocId` is not visible after filtering, the first visible doc becomes selected
- If search is active and the active category has zero results:
    - the page auto-switches to the first category that has results
    - `activeTagSet` is cleared

---

## Filtering and selection behavior

### Search behavior

Current behavior:

- query is trimmed and lowercased
- searchable fields include:
    - `title`
    - `description`
    - `category`
    - `tags`
- matching is substring based (`includes`)
- search results are sorted by `title` before regrouping

### Tag filtering behavior

Current behavior:

- tags filter only applies within the active category
- when `activeTagSet` is empty, tag filtering is skipped
- a doc matches if any of its tags exists in `activeTagSet`

### Selection behavior

Current behavior:

- if `selectedDocId` matches a visible doc, keep it
- otherwise select the first visible doc in the active category

Initial selection behavior:

- prefers the first doc within the first category tab
- falls back to the first doc in the registry

### Auto-switch behavior on empty search results

Current behavior:

- only runs when search text is not empty
- if current category has no results after search:
    - switch to the first category that has results
    - clear `activeTagSet`

---

## Extension points

### Add a new doc

- Add an MDX file under a valid category folder so it is picked up by `getComponentDocsRegistry()`
- Ensure required frontmatter fields exist (enforced by lint/registry)

### Customize MDX rendering

- Extend `mdxComponents` in this page to map additional tags
    - examples: `a`, `code`, headings

### Adjust category ordering

- Update `buildCategoryTabOptions`
- Current special-case:
    - `UI` is pinned first when present

### Add new filters

Guidelines:

- prefer pure helper functions for filtering
- keep the filtering pipeline deterministic:
    - search -> regroup by category -> active category tag filtering
- update “Key invariants” if you intentionally change behavior

---

## Checklist for future edits

Before changing behavior:

- confirm `UI` tab pinning still works
- confirm filtering order is unchanged
- confirm selection fallback still selects the first visible doc
- confirm auto-switch clears tag filters
- confirm no effect creates loops or unexpected resets

When adding features:

- add pure helper functions first, then wire into React state
- keep derived logic centralized rather than scattered
- keep `SidebarPanel` and `DocPanel` mostly presentational

When refactoring:

- refactor structure without changing behavior first
- add lightweight tests for filtering/selection invariants before deeper refactors

---

## Summary

This module provides a docs browsing experience for MDX component docs:

- category tabs + counts
- search + tag filtering
- deterministic selection behavior
- lazy-loaded MDX rendering
- visible registry validation issues via `componentDocsErrors`

---

## Maintenance notes

Known technical debt and refactor ideas live in:

- `src/component-docs/docs/technical-debt.md`

Keep this file focused on behavior and contracts.
Store refactor commentary and code smell analysis in the technical debt doc to avoid duplicating or drifting guidance.