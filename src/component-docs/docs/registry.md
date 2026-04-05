# Registry

This document explains how MDX docs are discovered, validated, and exposed to the docs UI.

---

## Table of contents

1. [File structure](#file-structure)
2. [Public API](#public-api)
3. [What the registry does](#what-the-registry-does)
4. [Discovery](#discovery)
5. [MDX module shape](#mdx-module-shape)
6. [Registry entry shape](#registry-entry-shape)
7. [Fallback behavior](#fallback-behavior)
8. [Category rules](#category-rules)
9. [Frontmatter validation](#frontmatter-validation)
10. [Errors surfaced in the UI](#errors-surfaced-in-the-ui)
11. [Caching and reset](#caching-and-reset)
12. [Troubleshooting](#troubleshooting)
13. [Summary](#summary)
14. [Maintenance notes](#maintenance-notes)

## File structure

The registry lives in `src/component-docs/registry/`:

```txt
registry/
  index.ts          # Re-exports public API
  registry.dev.ts   # Discovery, validation, and caching logic
  types.ts          # Shared types (ComponentDocEntry, Frontmatter, MdxModule)
```

## Public API

These exports are the contract the UI depends on (re-exported from `registry/index.ts`):

| Export | What it is | When to use |
|---|---|---|
| `getComponentDocsRegistry()` | Returns the cached `ReadonlyArray<ComponentDocEntry>` | Used by the docs UI to list and render docs |
| `resetComponentDocsRegistryCache()` | Clears registry, glob caches, and errors | Use in dev or tests when you need a clean rebuild |
| `normalizeCategoryKey()` | Normalizes a category key (trim, uppercase, default `UI`) | Use whenever grouping or comparing categories |
| `componentDocsErrors` | Collected validation errors during registry build | Read in the UI to display issues |

Types:

- `ComponentDocEntry`
- `DocComponent`

## What the registry does

- Scans MDX modules via Vite globs
- Builds an immutable, sorted `ReadonlyArray<ComponentDocEntry>`
- Collects validation problems into `componentDocsErrors` for the UI to display

## Discovery

The registry uses Vite `import.meta.glob` relative to `registry/`:

- eager glob: reads `frontmatter` immediately (build + validate)
- lazy glob: loads the MDX component only when selected in the UI

Globs:

- eager: `import.meta.glob('../**/*.mdx', { eager: true })`
- lazy: `import.meta.glob('../**/*.mdx')`

Since the registry lives in `registry/`, the `../` prefix scans all `.mdx` files under `src/component-docs/`.

Result:

- any `.mdx` under the component-docs directory is discoverable
- selected doc loads lazily via the `load()` function

## MDX module shape

Each MDX module is expected to export:

- `default`: React component (renders the MDX)
- optional `frontmatter`

Defined in `registry/types.ts`:

```ts
type MdxModule = Readonly<{
  default: ComponentType;
  frontmatter?: Frontmatter;
}>;

type Frontmatter = Readonly<{
  id?: string;
  title?: string;
  section?: string;
  category?: string;
  description?: string;
  tags?: string[];
}>;
```

## Registry entry shape

Each registry entry is frozen (`Object.freeze`) and the full array is sorted by `title` (locale compare):

```ts
type DocComponent = ComponentType<Record<string, unknown>>;

type ComponentDocEntry = Readonly<{
  id: string;
  title: string;
  section: string;
  category: string;
  description: string;
  tags?: string[];
  load: () => Promise<{ default: DocComponent }>;
}>;
```

Notes:

- `id` is what the UI uses for selection
- `category` is normalized and must match folder rules
- `load()` returns a lazy-loaded component
- `DocComponent` accepts `Record<string, unknown>` (not `any`)

## Fallback behavior

When frontmatter fields are missing, the registry applies these fallbacks instead of rejecting the entry:

| Field | Fallback | Notes |
|---|---|---|
| `id` | Filename without `.mdx` extension | e.g. `Button.mdx` becomes `Button` |
| `title` | Same as resolved `id` | |
| `section` | `'Components'` | |
| `category` | Folder category (normalized) | See category rules below |
| `description` | `''` (empty string) | |
| `tags` | `undefined` | |

Missing required fields still produce a validation error in `componentDocsErrors`, but the entry is still included in
the registry. The UI decides how to handle entries with errors.

## Category rules

### Category normalization

Categories are normalized using:

- trim
- uppercase
- default to `UI` if missing or empty

Equivalent logic:

```ts
String(raw ?? 'UI').trim().toUpperCase() || 'UI'
```

### Folder category inference

Category is inferred from the MDX file path relative to `src/component-docs/`:

- split the glob path by `/`
- use the second segment (index `[1]`) as the folder category
- fallback to `UI`

Example:

- `../ui/Button.mdx` -> path parts: `['..', 'ui', 'Button.mdx']` -> folder category `ui` -> normalized `UI`

### Resolved category

Final category is computed as:

1. Infer folder category and normalize it
2. Normalize frontmatter category if present
3. Resolved category:

    - frontmatter category when provided
    - otherwise folder category

### Category mismatch reporting

A mismatch error is reported only when **all** of these are true:

- the folder does not start with `_` (internal folders are excluded)
- frontmatter `category` is explicitly provided (not missing/empty)
- the normalized frontmatter category differs from the normalized folder category

If frontmatter `category` is omitted, the folder category is used silently with no error.

## Frontmatter validation

Required keys:

- `id`
- `title`
- `section`
- `category`
- `description`

If any required key is missing or empty:

- the registry pushes an error into `componentDocsErrors`
- the entry is still created using fallback values

Note: the registry does **not** detect duplicate `id` values at runtime. Duplicate detection is handled by the linter
(`yarn docs:lint`). See `docs/technical-debt.md` for context on this gap.

## Errors surfaced in the UI

`componentDocsErrors` is a module-level array:

- cleared at the start of registry build
- filled during validation (missing fields, category mismatches)
- read by the docs UI and displayed as a warning panel

All error messages are prefixed with `[MDX Docs]`.

## Caching and reset

### Caching

- first call to `getComponentDocsRegistry()` builds and caches entries
- later calls return cached data (using `??=` assignment)

### Reset

Use:

- `resetComponentDocsRegistryCache()`

It clears:

- registry cache
- eager glob cache
- lazy glob cache
- `componentDocsErrors` array

Use when you want a clean rebuild without restarting the dev server.

## Troubleshooting

| Problem | Likely cause | Fix |
|---|---|---|
| Doc does not show up | Missing required frontmatter or not under scanned path | Check `componentDocsErrors` and fix frontmatter or location |
| Category mismatch error | Frontmatter `category` differs from folder category | Update frontmatter or move file to the correct folder |
| Duplicate id issues | Another doc already uses the same `id` | Change `id` and run `yarn docs:lint` (runtime does not catch this) |
| Wrong title in gallery | Missing `title` in frontmatter | Add `title`; fallback is the raw `id` which may not look right |
| Stale data after adding a doc | Registry cache not invalidated | Call `resetComponentDocsRegistryCache()` or restart dev server |

## Summary

- Uses Vite globs from `registry/` (eager for metadata, lazy for rendering)
- Entries are frozen and sorted by title
- Missing frontmatter fields use fallbacks but still produce errors
- Categories are folder-driven and normalized
- Category mismatch is only reported when frontmatter category is explicitly provided
- Duplicate id detection is linter-only (not runtime)
- Registry is cached; reset forces a rebuild

## Maintenance notes

Refactor notes and known code smells live in: `src/component-docs/docs/technical-debt.md`