# RSK — React Starter Kit

A production-grade React + TypeScript starter template with an opinionated architecture, 78+ pre-built components, a warm earth design system in OKLCH, enforced code standards, and advanced tooling including a Swagger-to-TypeScript DTO generator and MDX component documentation. Built for teams that care about consistency, type safety, and developer experience.

---

## Architecture

RSK is built on five architectural pillars. Every decision — from folder structure to hook ordering — follows from these foundations.

### Component Hierarchy

| Tier   | Location                      | Purpose                              |
|--------|-------------------------------|--------------------------------------|
| Pages  | `src/pages/`                  | Route-level components; logic lives here |
| Views  | `src/views/<feature>/`        | Reusable across 2+ pages             |
| Shared | `src/components/shared/`      | Compound pattern                     |
| UI     | `src/components/ui/`          | Radix primitives + CVA               |
| Forms  | `src/components/forms/`       | React Hook Form wrappers             |
| Tables | `src/components/tables/`      | TanStack wrappers                    |

Shared components follow the compound component pattern: every sub-component accepts a `className` prop, uses `cn()` for class merging, spreads `...props` to the underlying element, and adds a `data-slot` attribute to enable parent-driven styling without prop drilling.

```
2+ semantic sub-parts? → Compound component
3+ visual variants?    → CVA
State across 3+ subs?  → Context
Simple leaf?           → Plain FC
```

### API Layer

The API layer is a typed pipeline with strict separation of concerns. Each layer has a single responsibility, and no layer reaches into another layer's domain.

Flow: `ApiEndpoints.ts` → `handlers/` → `hooks/queries/` & `hooks/mutations/` → `types/api/`

1. **Endpoints** (`src/api/config/ApiEndpoints.ts`) — URL constants only, no logic
2. **Handlers** (`src/api/handlers/`) — Axios calls using HttpClient, return typed promises
3. **Query Hooks** (`src/lib/hooks/queries/`) — TanStack `useQuery` wrappers; no direct Axios
4. **Mutation Hooks** (`src/lib/hooks/mutations/`) — TanStack `useMutation` wrappers; no direct Axios
5. **DTOs** (`src/types/api/`) — Generated or hand-authored TypeScript interfaces

DTO naming conventions:

| Suffix          | Usage                        |
|-----------------|------------------------------|
| `ForReadDto`    | GET responses                |
| `ForCreateDto`  | POST payloads                |
| `ForUpdateDto`  | PUT/PATCH payloads           |
| `ListDto`       | Item shape inside a list     |
| `ParamsDto`     | Query string parameters      |

Key rules: `queryKey` is a plain `string`, not an array. Every handler response is fully typed — `any` is not permitted.

### Design System

RSK uses the OKLCH color space with a warm earth palette centered on hue 55–65. This provides perceptually uniform lightness steps and vibrant, accessible color at every shade.

- 14 primary tonal variations spanning L 10–98
- Dual light/dark themes — every token is defined in both `:root` and `.dark` in `index.css`
- Shadow system built with `color-mix()` for theme-aware depth
- Shared a11y utilities exported from `src/lib/utils/tailwind.ts`: `FOCUS_RING`, `DISABLED_STYLES`, `TRANSITION_DEFAULT`
- DM Sans variable font, type scale from `2xs` to `2xl`

### Routing & Layouts

| Zone      | Layout            | Guard                         | Purpose                            |
|-----------|-------------------|-------------------------------|------------------------------------|
| Public    | None              | None                          | Landing page, public content       |
| Auth      | `AuthLayout`      | Redirects if authenticated    | Login, register                    |
| Protected | `DashboardLayout` | `AuthGuard`                   | Dashboard, components, settings    |

All page components are code-split with `React.lazy` + `Suspense`. Route constants live in `FULL_ROUTES_PATH` and the sidebar navigation is driven by `APP_MENU`, where each entry carries a Lucide icon (`LayoutDashboard`, `Component`, `Settings`).

### Enforced Patterns

- Compound components with `data-slot` on every element
- CVA for 3+ variants; `cn()` conditionals for 1–2
- `Conditional.If` component is mandatory — `&&` or ternary rendering is not permitted
- Strict hook ordering: `navigate` → context → utility hooks → queries → state → memo → callbacks → effects → JSX
- `handle*` prefix for all event handlers
- `import type` for type-only imports
- Path aliases (`@components`, `@hooks`, `@utils`, etc.) — no relative `../../` imports across feature boundaries
- `kebab-case` folders with barrel `index.ts` exports

---

## Tech Stack

| Domain        | Stack                                                              |
|---------------|--------------------------------------------------------------------|
| Core          | React, TypeScript, Vite (SWC), Tailwind CSS                       |
| UI Primitives | Radix UI (15+ primitives), CVA, lucide-react                      |
| Forms         | React Hook Form + Zod + 18 form components                        |
| Data          | TanStack React Query + React Table, Axios                         |
| State         | MobX (client state), React Query (server state)                   |
| Auth          | OIDC (Microsoft), AuthGuard HOC                                   |
| i18n          | i18next with browser detection                                    |
| Monitoring    | Sentry (error tracking), Firebase (push notifications)            |
| Docs          | MDX + rehype-pretty-code + Shiki (component gallery)              |
| Tooling       | DTO generator CLI, ESLint, Prettier, Vitest                       |

---

## Code Standards

The codebase enforces a 12-category standards checklist. Here are the key principles:

**Imports** — Path aliases only (`@components/ui`, not `../../../components/ui`). Strict ordering: React → third-party → UI → shared → hooks → utils → icons → types. Groups separated by empty lines.

**Types** — Use `type`, not `interface` (unless extension/merging is required). DTO naming follows the `ForReadDto`/`ForCreateDto`/`ForUpdateDto` convention. All type-only imports use `import type`.

**Conditional Rendering** — The `Conditional.If` component is mandatory. Never use `&&` or ternary operators for conditional rendering in JSX. Use the `fallback` prop for else-cases.

**Styling** — Theme-aware tokens only (`bg-background`, not `bg-white`). Use `cn()` for conditional class merging. Tailwind scale values only — no arbitrary pixel values like `p-[24px]`. No hardcoded hex/rgb colors.

**Component Order** — Strict internal hook ordering is enforced: core hooks → contexts → utility hooks → queries/mutations → refs → state → computed → callbacks → effects → JSX.

**Event Handlers** — All event handlers use the `handle*` prefix (`handleSubmit`, `handleDelete`).

**No Shortcuts** — No TODOs or placeholders in shipped code. No `any` types. No silently swallowed errors (use toast). No new dependencies without explicit approval.

**File-level ordering** — Before the component function, define types first, then constants and helper functions. Inside the function, follow the hook ordering above. Always separate groups with empty lines. Export as `default` at the bottom.

**Props** — Destructure props in the function signature. When there are too many props or names would collide with local variables, use the props object directly instead.

### Example

```tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@components/ui';

import { PrimeDialog } from '@components/shared';
import { FormContainer } from '@components/forms';

import { TaskCategoryView } from '@views/tasks';

import { useSomeContext } from '@contexts';
import { useToast } from '@hooks';
import { useUpdateTaskCategoryMutation } from '@hooks/mutations';

import { TASK_CATEGORIES } from '@constants';

import type { TaskCategory } from '@app-types';

// --- Types before the component ---
type TaskCategoryFormProps = {
  initialCategory?: TaskCategory;
};

// --- Constants before the component ---
const DEFAULT_FILTERS = { isActive: true };

const TaskCategoryForm = ({ initialCategory }: TaskCategoryFormProps) => {
  // 1. Core hooks
  const navigate = useNavigate();

  // 2. Contexts
  const { someContextValue } = useSomeContext();

  // 3. External utility hooks
  const { showToast } = useToast();

  // 4. Component-specific hooks (queries first, mutations second)
  const { mutate: updateTaskCategory } = useUpdateTaskCategoryMutation();

  // 5. Component state
  const [isOpen, setIsOpen] = useState(false);

  // 6. Computed values
  const activeCategories = useMemo(
    () => TASK_CATEGORIES.filter((c) => c.isActive),
    [],
  );

  // 7. Callbacks (handle* prefix)
  const handleSubmit = (data: TaskCategory) => {
    updateTaskCategory(data);
    showToast('Task category updated successfully');
    setIsOpen(false);
  };

  // 8. Effects (runs-once first, every-render last)
  useEffect(() => {
    // initialization logic
  }, []);

  // 9. JSX return — empty lines between siblings
  return (
    <PrimeDialog open={isOpen}>
      <Button onClick={() => setIsOpen(true)}>Edit</Button>

      <FormContainer>
        <TaskCategoryView categories={activeCategories} />

        <Button onClick={handleSubmit}>Save</Button>
      </FormContainer>
    </PrimeDialog>
  );
};

export default TaskCategoryForm;
```

For the complete 12-category standards checklist with wrong/correct pattern examples, see [`docs/CODE_STANDARDS.md`](docs/CODE_STANDARDS.md).

---

## Project Structure

```
src/
├── api/                    # API layer (endpoints, handlers, query client)
│   ├── config/             # ApiEndpoints.ts, HttpClient.ts
│   └── handlers/           # Domain-specific request handlers
├── components/
│   ├── ui/                 # 35 Radix-based primitives (Button, Dialog, Tabs...)
│   ├── shared/             # 25 compound components (FileUploader, Combobox...)
│   ├── forms/              # 18 React Hook Form wrappers (FormInput, FormSelect...)
│   ├── tables/             # TanStack React Table wrappers
│   └── utils/              # Conditional, HOCs
├── layouts/                # AuthLayout, DashboardLayout, ErrorBoundary
├── pages/                  # Route-level components (logic lives here)
├── views/                  # Reusable feature components (2+ pages only)
├── lib/
│   ├── hooks/              # queries/, mutations/, shared hooks
│   ├── contexts/           # ThemeContext
│   ├── utils/              # cn(), FOCUS_RING, storage, URL helpers
│   ├── constants/          # StorageKeys
│   └── hoc/                # withAuth, withConditional
├── types/                  # DTOs and shared type definitions
├── routes/                 # Router config, route constants, menu config
├── component-docs/         # MDX component documentation + gallery
├── locales/                # i18n translation files
└── assets/                 # Icons, images
scripts/
└── cli/                    # DTO generator CLI (fetch → parse → generate)
```

All folders use **kebab-case**. Each component lives in its own folder with a barrel `index.ts` export.

---

## Getting Started

### Prerequisites

- Node.js **22.14.0** (`.nvmrc` included)
- Yarn

### Install & Run

```bash
nvm use
yarn install
yarn dev
```

Opens on http://localhost:3000.

### Scripts

| Command           | Description                                                     |
|-------------------|-----------------------------------------------------------------|
| `yarn dev`        | Start the Vite development server                               |
| `yarn build`      | Type-check and build for production                             |
| `yarn build:dev`  | Build with the development mode flag                            |
| `yarn preview`    | Serve the production build locally                              |
| `yarn test`       | Run the Vitest test suite                                       |
| `yarn lint`       | Lint the codebase with ESLint 9                                 |
| `yarn dto:gen`    | Interactive DTO generation with diff badges                     |
| `yarn dto:list`   | List all tracked schemas in the manifest                        |
| `yarn dto:diff`   | Show schemas that have changed since last generation            |
| `yarn dto:clean`  | Remove orphaned generated files and update the manifest         |
| `yarn dto:init`   | Scaffold the `.dto-gen.json` configuration file                 |
| `yarn docs:new`   | Scaffold a new MDX component documentation file                 |
| `yarn docs:lint`  | Validate completeness of component documentation                |

### Important Notes

- **Path aliases** are configured in both `vite.config.ts` and `tsconfig.app.json`. Available aliases: `@api`, `@components`, `@hooks`, `@utils`, `@contexts`, `@constants`, `@layouts`, `@pages`, `@views`, `@routes`, `@app-types`, `@assets`, `@locales`, `@app-config`, `@hoc`, `@component-docs`.

- **Environment variables** — A `.env` file is required. All app variables use the `VITE_APP_*` prefix. Key variables: `VITE_APP_BASE_URL` (API base URL), `VITE_APP_CLIENT_ID` (OIDC client ID), plus Firebase config variables for push notifications.

- **DTO generator** — Requires a Swagger/OpenAPI endpoint configured in `.dto-gen.json`. Run `yarn dto:init` to scaffold the config file before first use.

- **Theming** — The default theme is dark. When adding new design tokens, define them in both `:root` (light) and `.dark` (dark) blocks in `index.css`.

- **Component docs** — Run `yarn docs:new` to scaffold MDX component documentation in `src/component-docs/`. The live demo gallery is driven by these files.

- **Conditional rendering** — `Conditional.If` is mandatory for all conditional rendering in JSX. Do not use `&&` or ternary expressions inside JSX templates.

- **Auth** — Authentication uses Microsoft OIDC via `oidc-client-ts`. `AuthGuard` wraps all protected routes as a HOC. Use the `useAuth()` hook to access the current user and auth state inside components.

---

## CLI Tools

### DTO Generator

The DTO generator runs a seven-step pipeline for each generation:

**Fetch → Parse → Filter → Resolve → Generate → Format → Write**

Features:
- Interactive schema selection with real-time diff badges showing what has changed
- Auto-dependency resolution via BFS — selecting a schema automatically includes all referenced schemas
- Flexible enum strategies — generate as TypeScript `type` literals or native `enum` declarations
- Manifest tracking — the generator records every generated file and automatically removes orphans on clean
- Post-generation formatting with Prettier and ESLint to ensure generated files match project standards

| Command           | Description                                                     |
|-------------------|-----------------------------------------------------------------|
| `yarn dto:gen`    | Run interactive DTO generation with diff badges                 |
| `yarn dto:list`   | List all schemas currently tracked in the manifest              |
| `yarn dto:diff`   | Show which tracked schemas have upstream changes                |
| `yarn dto:clean`  | Delete orphaned generated files and sync the manifest           |
| `yarn dto:init`   | Scaffold `.dto-gen.json` with a guided setup prompt             |

### Component Docs

Run `yarn docs:new` to scaffold MDX documentation for a new component. The scaffolded file includes frontmatter, a live demo section, and prop tables. Run `yarn docs:lint` to validate completeness.

### Components Gallery

The gallery is available at `/components` and showcases UI, Forms, and Shared components with live demos, syntax-highlighted code, and copyable usage snippets.

**No manual registration required.** The registry uses `import.meta.glob()` to auto-discover all `.mdx` files under `src/component-docs/`. Any folder at that level becomes a category (except `_template`, `scripts`, `docs`).

**Adding a new component doc:**

```bash
yarn docs:new
```

The interactive CLI prompts for category, component id (kebab-case), description, and optional tags — then scaffolds an MDX file in the correct folder.

**MDX frontmatter** (all 5 fields required):

| Field | Example |
|-------|---------|
| `id` | `alert` (kebab-case, unique) |
| `title` | `Alert` |
| `section` | `Components` (always) |
| `category` | `UI` (must match folder name) |
| `description` | `Display important messages with different severity levels.` |
| `tags` | `[ui, alert, feedback]` (optional, auto-generated by CLI) |

**MDX sections:** Each doc includes a `## Demo` section with live JSX, a `## Imports` section with the import statement, and a `## Code` section with usage examples. See any file under `src/component-docs/ui/` for reference.

**Validation:** Run `yarn docs:lint` before committing. It checks all required frontmatter fields, validates kebab-case ids, ensures category matches folder name, detects duplicate ids, and flags any remaining template placeholders.
