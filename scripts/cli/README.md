# dto-gen

Advanced TypeScript DTO generator that reads OpenAPI/Swagger specs and produces fully typed DTOs, enums, and type literals. Supports interactive schema selection, diff-aware generation, automatic dependency resolution, manifest-based auto-delete, and a pluggable pipeline architecture.

---

## Quick Start

```bash
# Interactive mode — diff-aware schema selection with prompts
npm run dto:gen

# List every available schema
npm run dto:list

# Show diff between BE schemas and local files
npm run dto:diff

# One-time cleanup of orphaned files not in BE swagger
npm run dto:clean
```

---

## npm Scripts

| Script | Description |
|---|---|
| `npm run dto:gen` | Interactive diff-aware mode (prompts for version, schemas, strategy) |
| `npm run dto:list` | List available schemas with kinds and property counts |
| `npm run dto:diff` | Show diff between BE schemas and local files |
| `npm run dto:init` | Create a `.dto-gen.json` config file |
| `npm run dto:clean` | Delete orphaned local files not in BE swagger and create manifest |

---

## Commands Reference

### `generate` (alias: `g`)

Generate DTOs from Swagger specs.

```
dto-gen generate [options]
```

| Flag | Description | Default |
|---|---|---|
| `-i, --interactive` | Launch interactive mode with prompts | `false` |
| `-c, --config <path>` | Path to config file | `.dto-gen.json` |
| `-v, --version <version>` | API version to generate (`v1`, `v2`, `all`) | `all` |
| `-s, --schemas <schemas>` | Comma-separated schema names to generate | all schemas |
| `-e, --enum-strategy <strategy>` | `type-literal` or `enum` | `type-literal` |
| `--diff` | Pre-compute diff and show status badges in interactive selection | `false` |
| `--dry-run` | Preview changes without writing files | `false` |

### `list` (alias: `ls`)

List available schemas from Swagger.

```
dto-gen list [options]
```

| Flag | Description | Default |
|---|---|---|
| `-v, --version <version>` | API version (`v1`, `v2`, `all`) | `all` |
| `--json` | Output as JSON | `false` |
| `--diff` | Show diff status per schema (`new`, `updated`, `unchanged`) | `false` |

### `clean`

Delete local model files that are not present in the BE swagger spec. Creates a `.dto-gen.manifest.json` for remaining files. Useful for one-time cleanup of legacy files from previous code generators.

```
dto-gen clean [options]
```

| Flag | Description | Default |
|---|---|---|
| `-v, --version <version>` | API version (`v1`, `v2`, `all`) | `all` |
| `--dry-run` | Preview deletions without modifying files | `false` |

### `init`

Initialize a `.dto-gen.json` config file in the project root.

```
dto-gen init [options]
```

| Flag | Description | Default |
|---|---|---|
| `-f, --force` | Overwrite existing config | `false` |

---

## Usage Examples

### Interactive mode (default)

Walks through version selection, diff-aware schema picker, and enum strategy:

```bash
npm run dto:gen
```

Schemas are labeled with diff status badges:
- `[new]` — exists in BE but no local file
- `[updated]` — local file differs from BE schema
- `(no diff)` — local file matches BE schema

### Generate specific schemas

Pass schema names with `-s`. Dependencies are resolved automatically:

```bash
npx tsx scripts/cli/bin-cli/dto-gen.ts generate -s AppointmentForReadV2Dto,DoctorForReadDto
```

### Dry run preview

See what would change without touching the filesystem:

```bash
npx tsx scripts/cli/bin-cli/dto-gen.ts generate --dry-run
```

### Show diff between BE and local files

```bash
npm run dto:diff
```

Output example:

```
v1 — 373 schemas (2 new, 5 updated, 366 unchanged)
  [dto]    BasicEntityReadDto (3 props)           [new]
  [dto]    UserDetailsForReadDto (8 props)        [new]
  [dto]    AttorneyForCreateUpdateDto (13 props)  (updated)
  [dto]    DoctorForReadDto (15 props)            (updated)
  ...

Summary: 2 new, 5 updated, 366 unchanged
```

### Clean up orphaned files

Preview what would be deleted:

```bash
npx tsx scripts/cli/bin-cli/dto-gen.ts clean --dry-run
```

Run the actual cleanup:

```bash
npm run dto:clean
```

### List schemas as JSON

```bash
npx tsx scripts/cli/bin-cli/dto-gen.ts list --json
```

---

## Diff Mode

The `--diff` flag compares what the generator would produce against what exists on disk. It uses Prettier formatting on the generated content and blank-line-insensitive comparison to avoid false positives from cosmetic formatting differences.

Statuses:
- **new** — schema exists in BE swagger but no corresponding local `.ts` file
- **updated** — local file content differs from what the generator would produce
- **unchanged** — local file matches the generated output

The diff is available in two places:
1. `dto:diff` (`list --diff`) — standalone diff report
2. `dto:gen` (`generate --diff -i`) — badges shown in the interactive schema picker

---

## Manifest & Auto-Delete

The tool uses a hash-based manifest (`.dto-gen.manifest.json`) to track files it has generated. This enables safe auto-deletion of orphaned files on every `dto:gen` run.

### How it works

1. **On generation**: the Write step records each generated file's content hash in the manifest
2. **Orphan detection**: after writing, any `.ts` file in `models/` that is not in the current BE swagger is checked:
   - **Untracked** (not in manifest) — skipped with a warning. These are manually created files or files from other tools.
   - **Modified** (in manifest but hash differs) — skipped with a warning. The file was hand-edited after generation.
   - **Unchanged** (in manifest and hash matches) — safely deleted. The file was generated by dto-gen and never modified.
3. **Manifest saved** after each run

### Manifest file

```jsonc
// .dto-gen.manifest.json — located in each outputDir (e.g. src/types/api/)
{
  "ActiveReportForListDto.ts": "a1b2c3d4...",
  "AppointmentForReadDto.ts": "e5f6g7h8...",
  // filename -> MD5 content hash
}
```

### The `clean` command

For initial setup or migrating from another code generator, use `dto:clean` to:

1. Fetch the current BE swagger spec
2. Delete all local model files not present in the spec
3. Rebuild the barrel `index.ts` from remaining files
4. Create the manifest from remaining files

This is a one-time operation. After running `clean`, subsequent `dto:gen` runs handle orphan deletion automatically via the manifest.

---

## Template Features

### `@deprecated` annotation

Properties marked as `deprecated: true` in the OpenAPI spec are generated with a JSDoc `@deprecated` tag:

```typescript
export type AppointmentForReadDto = {
  id: string;
  /**
   * @deprecated
   */
  legacyField?: string | null;
  status: string;
};
```

### `readOnly` annotation

Properties marked as `readOnly: true` in the OpenAPI spec are generated with the TypeScript `readonly` modifier:

```typescript
export type UserForReadDto = {
  readonly id: string;
  readonly createdAt: string;
  name: string;
};
```

---

## Auto-Dependency Resolution

When you generate a specific schema with `-s`, the tool performs a **transitive BFS** over all `$ref` imports to discover every type the schema depends on. Missing dependencies are auto-included and a visual tree is printed:

```
  Schema selection:
    ✓ AppointmentForReadV2Dto  (v2)

  Dependency tree:
    AppointmentForReadV2Dto
    ├── DoctorBasicDetailsForReadDto
    │   └── SpecialityForReadDto
    ├── PatientForReadDto
    │   └── NationalityForReadDto
    └── ClinicForReadDto

  Auto-included 5 dependency schema(s).
```

If a requested schema name is not found, it shows:

```
    ✗ FakeSchemaName  (not found)
```

---

## Configuration

The tool reads `.dto-gen.json` from the project root. Run `npm run dto:init` to generate a default config.

```jsonc
{
  "endpoints": [
    {
      "name": "v1",
      "url": "https://dev-api.qlinica.app/med-legal/swagger/v1/swagger.json",
      "outputDir": "src/types/api"
    },
    {
      "name": "v2",
      "url": "https://dev-api.qlinica.app/med-legal/swagger/v2/swagger.json",
      "outputDir": "src/types/api-v2"
    }
  ],
  "enumStrategy": "type-literal",   // "type-literal" | "enum"
  "formatting": {
    "prettier": true,                // Run Prettier on generated files
    "eslint": true                   // Run ESLint --fix on generated files
  }
}
```

| Field | Type | Description |
|---|---|---|
| `endpoints` | `SwaggerEndpoint[]` | Swagger JSON URLs and output directories |
| `endpoints[].name` | `string` | Label used for version filtering (`v1`, `v2`, etc.) |
| `endpoints[].url` | `string` | Full URL to the `swagger.json` |
| `endpoints[].outputDir` | `string` | Output directory relative to project root |
| `enumStrategy` | `"type-literal" \| "enum"` | How to generate enum-like schemas |
| `formatting.prettier` | `boolean` | Run Prettier after generation |
| `formatting.eslint` | `boolean` | Run ESLint `--fix` after generation |

---

## Architecture

The tool uses a **pipeline pattern** with seven sequential steps. Each step transforms a shared `PipelineContext` and can be extended via plugin hooks.

```
Fetch ─> Parse ─> Filter ─> Resolve ─> Generate ─> Format ─> Write
```

| Step | Responsibility |
|---|---|
| **Fetch** | Downloads Swagger JSON from configured endpoints |
| **Parse** | Converts OpenAPI schemas into an Intermediate Representation (IR) using a Visitor pattern |
| **Filter** | Narrows schemas to the user's selection (or keeps all) |
| **Resolve** | BFS over `$ref` imports to auto-include transitive dependencies |
| **Generate** | Dispatches each IR schema to the correct generator via the Registry pattern |
| **Format** | Runs Prettier and ESLint plugins on generated code |
| **Write** | Writes files to disk with hash-based change detection, updates manifest, auto-deletes orphans |

### Design Patterns

| Pattern | Where |
|---|---|
| **Pipeline / Middleware** | `Pipeline.ts` orchestrates steps with before/after hooks |
| **Visitor** | `SchemaVisitor.ts` + `SchemaParser.ts` traverse OpenAPI nodes |
| **Strategy** | `DtoGenerator`, `EnumGenerator`, `TypeLiteralGenerator` are swappable strategies |
| **Registry** | `GeneratorRegistry.ts` maps schema kinds to generators |
| **Plugin + Hooks** | `PluginManager.ts` runs lifecycle hooks (`beforeFetch`, `afterGenerate`, etc.) |
| **Builder** | `BarrelGenerator.ts` constructs `index.ts` barrel exports |
| **IR (Intermediate Representation)** | `ir.ts` decouples OpenAPI schema from output format |
| **Template** | Handlebars `.hbs` files for code generation |

---

## Project Structure

```
scripts/cli/
├── bin-cli/
│   └── dto-gen.ts              # CLI entry point (Commander.js)
├── commands/
│   ├── generate.ts             # generate command handler
│   ├── list.ts                 # list command handler (supports --diff mode)
│   ├── init.ts                 # init command handler
│   └── clean.ts                # clean command handler (orphan deletion + manifest)
├── config/
│   ├── defaults.ts             # Default endpoints and config values
│   ├── loader.ts               # Loads .dto-gen.json or falls back to defaults
│   └── schema.ts               # Zod validation for config
├── core/
│   ├── BarrelGenerator.ts      # Generates index.ts barrel exports
│   ├── CodeGenerator.ts        # Orchestrates generation via registry
│   ├── FileWriter.ts           # Writes files with hash-based change detection
│   ├── ManifestManager.ts      # Hash-based manifest for tracking generated files
│   ├── SchemaParser.ts         # OpenAPI -> IR conversion
│   ├── SchemaVisitor.ts        # Visitor interface + walk function
│   └── SwaggerFetcher.ts       # Fetches swagger JSON with caching
├── generators/
│   ├── BaseGenerator.ts        # Abstract base with Handlebars rendering
│   ├── DtoGenerator.ts         # export type X = { ... } (supports @deprecated, readonly)
│   ├── EnumGenerator.ts        # export const enum X { A = 'A' }
│   ├── GeneratorRegistry.ts    # Registry mapping schema kinds to generators
│   └── TypeLiteralGenerator.ts # export type X = 'A' | 'B'
├── pipeline/
│   ├── Pipeline.ts             # Pipeline orchestrator with plugin hooks
│   ├── PipelineContext.ts      # Shared mutable state
│   └── steps/
│       ├── FetchStep.ts
│       ├── ParseStep.ts
│       ├── FilterStep.ts
│       ├── ResolveStep.ts      # BFS dependency resolution + tree output
│       ├── GenerateStep.ts
│       ├── FormatStep.ts
│       └── WriteStep.ts        # Write + manifest update + orphan auto-delete
├── plugins/
│   ├── Plugin.ts               # Plugin type + HookName definitions
│   ├── PluginManager.ts        # Registers and runs plugins
│   ├── PrettierPlugin.ts       # Prettier formatting plugin
│   └── ESLintPlugin.ts         # ESLint --fix plugin
├── prompts/
│   ├── interactive.ts          # Full interactive flow (diff-aware)
│   ├── versionSelector.ts      # API version checkbox prompt
│   ├── schemaSelector.ts       # Schema multi-select + generation mode
│   ├── searchableCheckbox.ts   # Custom searchable checkbox prompt
│   └── strategySelector.ts     # Enum strategy + additional options
├── templates/
│   ├── file-header.hbs         # Auto-generated file header
│   ├── dto.hbs                 # DTO type template (with @deprecated, readonly)
│   ├── enum.hbs                # Enum template
│   ├── type-literal.hbs        # Type literal union template
│   └── barrel.hbs              # Barrel index.ts template
├── types/
│   ├── config.ts               # Config types (DtoGenConfig, SwaggerEndpoint, CleanCommandOptions)
│   ├── diff.ts                 # Diff types (DiffStatus, SchemaDiffResult)
│   ├── generator.ts            # GeneratorResult, PipelineStats, GeneratorEntry
│   ├── index.ts                # Barrel export
│   ├── ir.ts                   # Intermediate Representation types (IRSchema, IRProperty)
│   └── openapi.ts              # OpenAPI document types
└── utils/
    ├── diff.ts                 # Diff computation (BE vs local, blank-line-insensitive)
    ├── hash.ts                 # MD5 content hashing (whitespace-normalized)
    ├── logger.ts               # Styled console output (tree, tables, spinners, diff labels)
    ├── naming.ts               # PascalCase / filename conventions
    └── path.ts                 # Path utilities
```
