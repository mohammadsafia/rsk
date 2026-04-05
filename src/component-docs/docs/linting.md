# Linting

The MDX linter enforces consistency across all docs under `src/component-docs/`.
Run it before committing any docs changes.

---

## Table of contents

1. [Command](#command)
2. [Scan scope](#scan-scope)
3. [Validation order](#validation-order)
4. [Error types and fixes](#error-types-and-fixes)
5. [Placeholder markers](#placeholder-markers)
6. [How to debug](#how-to-debug)
7. [Summary](#summary)
8. [Maintenance notes](#maintenance-notes)

## Command

```bash
yarn docs:lint
```

## Scan scope

The linter validates every `.mdx` file under `src/component-docs/`, recursively.

It skips directories starting with `_` (e.g. `_template`).

All other folders are scanned, including `scripts` and `docs`. If those folders contain `.mdx` files, they will be
linted.

## Validation order

The linter checks each file in a specific order. If a check fails early, later checks for that file are skipped.

1. **Required frontmatter fields** — all five must be present and non-empty
2. **Schema validation** — Zod parse (correct types, `tags` as string array)
3. **Kebab case check** — `id` must match `^[a-z0-9]+(?:-[a-z0-9]+)*$`
4. **Category mismatch** — frontmatter `category` vs folder name (both uppercased)
5. **Duplicate id** — first occurrence wins, later files are flagged
6. **Template placeholders** — file body must not contain placeholder markers

If step 1 fails, steps 3-6 are not checked for that file. If step 2 fails, steps 3-6 are skipped. Fix errors from the
top down.

## Error types and fixes

| Error | What it means | How to fix |
|---|---|---|
| `missing required frontmatter field "X"` | A required key is missing or empty in frontmatter | Add the missing field and ensure it is not empty |
| `invalid frontmatter` | Frontmatter exists but fails Zod schema validation (wrong type/shape) | Fix field types (strings for required fields, `tags` as string array) |
| `frontmatter id must be kebab case` | `id` contains spaces, uppercase, or invalid characters | Change `id` to kebab case (example: `toggle-group`) |
| `category mismatch` | Folder category does not match frontmatter `category` after normalization | Move the file into the correct folder, or update `category` in frontmatter to match |
| `duplicate id "X"` | Another doc already uses the same `id` | Pick a new unique `id` (and update filename if needed) |
| `still contains template placeholder text` | The doc still has one or more placeholder markers | Replace all placeholder text with real content |

### Required frontmatter

Every MDX doc must contain these fields:

* `id`
* `title`
* `section`
* `category`
* `description`

Optional:

* `tags`

Example:

```md
---
id: toggle-group
title: Toggle Group
section: Components
category: UI
description: A group of toggleable buttons.
tags: ["ui", "toggle", "group"]
---
```

### Category normalization

Both the folder name and frontmatter `category` are normalized before comparison:

* trimmed
* uppercased
* defaults to `UI` if empty or missing

The folder category is inferred from the first path segment relative to `src/component-docs/`. For example,
`src/component-docs/ui/Button.mdx` has folder category `ui`, normalized to `UI`.

## Placeholder markers

The linter checks if the raw file content contains any of these strings:

* `component-id`
* `Component Name`
* `RealComponentName`
* `Replace these placeholders`

If any are found, the file fails with the "template placeholder text" error. Replace them with actual component-specific
content.

## How to debug

If lint fails:

1. Read the first failing file path in the output
2. Fix errors from the top of the validation order (missing fields first, then schema, then others)
3. Re-run:

```bash
yarn docs:lint
```

Common fixes:

* Ensure the frontmatter block starts at the very top of the file
* Ensure required fields are not blank
* Ensure `category` matches the folder name (normalized to uppercase)
* Ensure `tags` is an array of strings (not a comma string)
* Replace all template placeholder text before linting

Note: duplicate errors are deduplicated in the output. If you see the same error only once, it may come from multiple
files — fix and re-run to reveal remaining issues.

## Summary

* Run `yarn docs:lint` before committing
* Only `_*` directories are excluded from scanning
* Validation is ordered — fix missing fields first before other errors appear
* Fix errors using the "Error types and fixes" table
* The linter enforces ids, categories, schema, and template cleanup

## Maintenance notes

Refactor notes and known code smells live in: `src/component-docs/docs/technical-debt.md`