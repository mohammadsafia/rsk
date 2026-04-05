# CLI

This document explains the MDX docs generator CLI (`yarn docs:new`): what it prompts for, what it creates, and common
failure cases.

---

## Table of contents

1. [Command](#command)
2. [What it generates](#what-it-generates)
3. [Prompts](#prompts)
4. [How naming works](#how-naming-works)
5. [Tags generation](#tags-generation)
6. [Duplicate detection](#duplicate-detection)
7. [Template rendering](#template-rendering)
8. [Editor auto-open behavior](#editor-auto-open-behavior)
9. [Common failures](#common-failures)
10. [Summary](#summary)
11. [Maintenance notes](#maintenance-notes)

## Command

```bash
yarn docs:new
```

## What it generates

The CLI creates a single MDX file under `src/component-docs/<category>/`.

It also tries to open the created file in an editor.

The CLI does not:

* register docs manually anywhere
* change registry behavior
* modify existing docs

## Prompts

The generator asks for:

1. Category folder
   Pick from folders under `src/component-docs/` excluding:

    * folders starting with `_`
    * `scripts`

   Note: `docs` is **not** excluded from the category picker. If you do not want it treated as a category, do not place
   MDX files there.

2. Component id (kebab case)
   Example: `toggle-group`

   The CLI validates that the input is already in kebab case. If not, it shows the normalized form and asks you to use
   it (e.g. entering `Toggle Group` shows `Use: toggle-group`).

3. One sentence description
   Example: `A group of toggleable buttons.`

4. Extra tags (comma separated)
   Example: `actions, buttons`

Then it asks for confirmation before writing the file.

## How naming works

### ID normalization

The CLI normalizes the id by:

* trimming whitespace
* lowercasing
* replacing non-alphanumerics with `-`
* removing leading/trailing `-`

So even if you type `Toggle Group`, the final id becomes `toggle-group`.

### File name

The generated file name is PascalCase derived from the id:

* id: `toggle-group`
* file: `ToggleGroup.mdx`

### Component name

The generated component import name is also PascalCase from the id:

* id: `toggle-group`
* component name: `ToggleGroup`

### Import path

The import path is derived from the category folder:

* folder: `ui`
* import path: `@components/ui`

### Output path

The output path is:

* `src/component-docs/<folderName>/<PascalCase(id)>.mdx`

Example:

* category folder: `ui`
* id: `toggle-group`
* output: `src/component-docs/ui/ToggleGroup.mdx`

## Tags generation

The CLI builds tags from:

* category folder (lowercased)
* the full id
* id parts (split by `-`)
* extra tags entered by the user

Then it:

* trims each tag
* removes empties
* de-duplicates (preserves insertion order)

Example:

* folder: `ui`
* id: `toggle-group`
* extra tags: `actions, buttons`

Resulting tags:

* `ui`
* `toggle-group`
* `toggle`
* `group`
* `actions`
* `buttons`

Tags are written to frontmatter as unquoted inline values: `tags: [ui, toggle-group, toggle, group, actions, buttons]`

## Duplicate detection

Before writing, the CLI scans all existing `.mdx` files (excluding `_*` and `scripts` folders) and checks for
duplicates using:

1. The frontmatter `id` field (if present)
2. The filename without extension as fallback (if no frontmatter `id`)

If either matches the new id, the CLI aborts with a "Duplicate id" error and prints the path of the conflicting file.

## Template rendering

The CLI reads the shared template:

* `src/component-docs/_template/component.mdx.tpl`

It replaces these placeholders:

| Placeholder         | Source                                  | Example value              |
|---------------------|-----------------------------------------|----------------------------|
| `{{id}}`            | Normalized id                           | `toggle-group`             |
| `{{title}}`         | Title case from id                      | `Toggle Group`             |
| `{{category}}`      | Uppercase folder name                   | `UI`                       |
| `{{description}}`   | User input (trimmed)                    | `A group of toggleable buttons.` |
| `{{tagsInline}}`    | Formatted tag list                      | `ui, toggle-group, toggle, group` |
| `{{importPath}}`    | `@components/<folder>`                  | `@components/ui`           |
| `{{componentName}}` | PascalCase from id                      | `ToggleGroup`              |

The generated file includes three sections: **Demo**, **Imports**, and **Code** — each with a starter code block using
the component name and import path.

If you change the template, you change the structure of every newly generated doc.

## Editor auto-open behavior

After generating the file, the CLI tries to open it in this order:

| Priority | Editor    | Detection                                                      |
|----------|-----------|----------------------------------------------------------------|
| 1        | WebStorm  | Multiple paths checked per platform (macOS, Linux, Windows)    |
| 2        | VS Code   | `code --reuse-window`                                          |
| 3        | Fallback  | `xdg-open` (Linux) or `open` (macOS)                          |

If none work, the CLI still creates the file and prints its path so you can open it manually.

## Common failures

### "No category folders found"

Cause:

* no category folders exist under `src/component-docs/`, or all are excluded

Fix:

* create a category folder such as `src/component-docs/ui/`

### "Duplicate id already exists"

Cause:

* another doc already uses the same `id` (checked via frontmatter id or filename)

Fix:

* choose a different id

### File did not open

Cause:

* WebStorm launcher not installed / not on PATH
* `code` command not installed
* missing desktop opener tools

Fix:

* open the printed file path manually
* ensure your editor CLI launcher works from the terminal

## Summary

* Use `yarn docs:new` to create docs (do not create MDX manually)
* Category comes from folder selection (excludes `_*` and `scripts` only)
* File name, component name, and import path are derived from the id
* Tags are auto-generated and de-duplicated
* Duplicate detection checks both frontmatter id and filename
* The CLI tries to open the created file, but file creation succeeds even if opening fails

## Maintenance notes

Refactor notes and known code smells live in: `src/component-docs/docs/technical-debt.md`