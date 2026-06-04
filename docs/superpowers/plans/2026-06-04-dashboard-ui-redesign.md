# Dashboard UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin the app with an Ocean Blue palette (light + dark), redesign the dashboard sidebar as a floating/inset card, replace the header with a functional ⌘K command palette, and add a sample dashboard page.

**Architecture:** All color changes are values-only edits to the existing CSS variable system in `src/index.css` (token names unchanged, so all components keep working). The sidebar/header are restyled in place. The ⌘K palette is a new shared component built on the repo's existing cmdk `Command.Dialog`, with open state + global shortcut held in a new `CommandPaletteContext`. The sample dashboard page composes existing `Card` primitives plus a dependency-free SVG chart.

**Tech Stack:** React 18, TypeScript, Vite 6, Tailwind CSS v4 (OKLCH tokens), Radix UI, cmdk, lucide-react, react-router-dom v6.

**Conventions for every commit:** prefix messages with `feat:` / `refactor:`; end the message with the trailer `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`. Because `/docs` is gitignored, this plan and spec were force-added; source files under `src/` commit normally.

**Testing note:** This repo has **no component test harness** (no jsdom / @testing-library; zero existing test files). Per the approved spec, verification is **`npx tsc -b` (type check) + `yarn lint` + concrete manual checks**, not automated component tests. Do not fabricate tests that cannot run.

**Reference spec:** `docs/superpowers/specs/2026-06-04-dashboard-ui-redesign-design.md`

---

## File Structure

**Modified**
- `src/index.css` — `:root` + `.dark` token values → Ocean Blue
- `src/app-config/appConfig.ts` — add `APP_NAME`
- `src/routes/routes.ts` — add `group?` to `AppMenu`; tag menu items
- `src/routes/router.tsx` — wire `DashboardPage`
- `src/lib/contexts/index.ts` — export command-palette context
- `src/components/shared/index.ts` — export `CommandPalette`
- `src/layouts/dashboard-sidebar-link/DashboardSidebarLink.tsx` — active pill
- `src/layouts/dashboard-sidebar/DashboardSidebar.tsx` — floating card, brand, groups, profile
- `src/layouts/dashboard-header/DashboardHeader.tsx` — ⌘K trigger + actions
- `src/layouts/dashboard-layout/DashboardLayout.tsx` — inset canvas + provider + palette mount

**Created**
- `src/lib/contexts/CommandPaletteContext.tsx`
- `src/components/shared/command-palette/CommandPalette.tsx`
- `src/components/shared/command-palette/index.ts`
- `src/pages/dashboard/DashboardPage.tsx`

---

## Task 1: Ocean Blue palette

**Files:**
- Modify: `src/index.css` (the `:root` block ~lines 115–201 and the `.dark` block ~lines 203–289)

- [ ] **Step 1: Replace the `:root` token block**

Replace the entire `:root { ... }` block inside `@layer base` (from the `/* Warm earth palette ... */` comment through the closing `}` before `.dark`) with:

```css
  :root {
    /* Ocean Blue — cool slate neutrals (hue ~256) + blue brand (hue ~264) */
    --background: oklch(0.985 0.003 256);      /* near-white, faint cool */
    --foreground: oklch(0.21 0.03 264);        /* slate-900 #0F172A */

    --primary: oklch(0.55 0.21 264);           /* blue-600 #2563EB */
    --primary-15:  oklch(0.97 0.02 264);       /* blue-50 */
    --primary-25:  oklch(0.95 0.03 264);
    --primary-50:  oklch(0.93 0.05 264);       /* blue-100 */
    --primary-100: oklch(0.87 0.09 264);       /* blue-200 */
    --primary-200: oklch(0.78 0.13 264);       /* blue-300 */
    --primary-300: oklch(0.70 0.17 264);       /* blue-400 */
    --primary-400: oklch(0.62 0.20 264);       /* blue-500 #3B82F6 */
    --primary-600: oklch(0.50 0.20 264);       /* blue-700 #1D4ED8 */
    --primary-700: oklch(0.45 0.18 265);       /* blue-800 */
    --primary-800: oklch(0.39 0.15 266);       /* blue-900 */
    --primary-900: oklch(0.31 0.11 266);       /* blue-950 */
    --primary-foreground: oklch(0.99 0 0);

    --secondary: oklch(0.97 0.006 256);        /* slate-100 #F1F5F9 — app canvas */
    --secondary-15:  oklch(0.985 0.003 256);
    --secondary-25:  oklch(0.98 0.004 256);
    --secondary-50:  oklch(0.975 0.005 256);
    --secondary-100: oklch(0.97 0.006 256);
    --secondary-200: oklch(0.93 0.008 256);    /* slate-200 */
    --secondary-300: oklch(0.88 0.01 256);     /* slate-300 */
    --secondary-400: oklch(0.83 0.012 256);
    --secondary-600: oklch(0.62 0.03 257);
    --secondary-700: oklch(0.50 0.03 257);
    --secondary-800: oklch(0.37 0.03 260);
    --secondary-900: oklch(0.28 0.03 262);
    --secondary-foreground: oklch(0.21 0.03 264);

    --muted: oklch(0.83 0.012 256);            /* visible slate borders */
    --muted-50:  oklch(0.985 0.003 256);
    --muted-100: oklch(0.97 0.006 256);        /* subtle bg tint */
    --muted-200: oklch(0.92 0.008 256);        /* slate-200 borders/dividers */
    --muted-300: oklch(0.45 0.03 257);         /* tertiary text */
    --muted-400: oklch(0.50 0.03 257);         /* secondary text */
    --muted-foreground: oklch(0.55 0.03 257);  /* slate-500 #64748B */

    --surface: oklch(0.985 0.003 256);
    --surface-15: oklch(0.985 0.003 256 / 15%);
    --surface-25: oklch(0.985 0.003 256 / 25%);
    --surface-50: oklch(0.985 0.003 256 / 50%);
    --surface-70: oklch(0.985 0.003 256 / 70%);
    --surface-foreground: oklch(0.21 0.03 264);

    --accent: oklch(0.95 0.03 264);            /* soft blue hover surfaces */
    --accent-200: oklch(0.93 0.05 264);
    --accent-300: oklch(0.87 0.09 264);
    --accent-400: oklch(0.78 0.13 264);
    --accent-foreground: oklch(0.21 0.03 264);

    --success: oklch(0.72 0.16 157) !important;
    --success-200: oklch(0.97 0.013 160);
    --success-300: oklch(0.95 0.025 158);
    --success-400: oklch(0.85 0.10 157);
    --success-foreground: oklch(0.99 0 0);

    --destructive: oklch(0.60 0.23 28) !important;
    --destructive-200: oklch(0.96 0.016 17);
    --destructive-300: oklch(0.92 0.036 18);
    --destructive-400: oklch(0.70 0.16 22);
    --destructive-foreground: oklch(0.99 0 0);

    --warning: oklch(0.82 0.17 78) !important;
    --warning-200: oklch(0.97 0.039 88);
    --warning-300: oklch(0.94 0.072 88);
    --warning-400: oklch(0.87 0.148 85);
    --warning-foreground: oklch(0.21 0.03 264);

    --border: oklch(0.21 0.03 264 / 12%);       /* slate border */

    --sidebar: oklch(0.985 0.003 256);          /* white-ish floating card */
    --sidebar-foreground: oklch(0.21 0.03 264);
    --sidebar-accent: oklch(0.95 0.01 256);     /* hover bg */
    --sidebar-accent-foreground: oklch(0.21 0.03 264);
    --sidebar-border: oklch(0.21 0.03 264 / 8%);

    --popover: oklch(1 0 0);
    --popover-foreground: oklch(0.21 0.03 264);

    --code-surface: oklch(0.21 0.03 264);
    --code-foreground: oklch(0.93 0.01 256);
    --code-muted: oklch(0.55 0.03 257);
  }
```

- [ ] **Step 2: Replace the `.dark` token block**

Replace the entire `.dark { ... }` block with:

```css
  .dark {
    /* Ocean Blue — dark slate canvas (hue ~264) + brighter blue brand */
    --background: oklch(0.18 0.02 264);         /* deep slate canvas */
    --foreground: oklch(0.97 0.005 256);

    --primary: oklch(0.62 0.19 264);            /* blue-500 #3B82F6 */
    --primary-15:  oklch(0.25 0.04 264);
    --primary-25:  oklch(0.28 0.05 264);
    --primary-50:  oklch(0.32 0.07 264);
    --primary-100: oklch(0.38 0.10 264);
    --primary-200: oklch(0.45 0.14 264);
    --primary-300: oklch(0.53 0.17 264);
    --primary-400: oklch(0.58 0.18 264);
    --primary-600: oklch(0.68 0.17 264);
    --primary-700: oklch(0.75 0.14 262);
    --primary-800: oklch(0.83 0.10 260);
    --primary-900: oklch(0.90 0.06 258);
    --primary-foreground: oklch(0.99 0 0);

    --secondary: oklch(0.24 0.02 264);          /* elevated panels */
    --secondary-15:  oklch(0.20 0.02 264);
    --secondary-25:  oklch(0.21 0.02 264);
    --secondary-50:  oklch(0.22 0.02 264);
    --secondary-100: oklch(0.24 0.02 264);
    --secondary-200: oklch(0.28 0.02 264);
    --secondary-300: oklch(0.33 0.02 264);
    --secondary-400: oklch(0.40 0.02 263);
    --secondary-600: oklch(0.58 0.03 260);
    --secondary-700: oklch(0.68 0.03 258);
    --secondary-800: oklch(0.80 0.02 256);
    --secondary-900: oklch(0.90 0.015 256);
    --secondary-foreground: oklch(0.97 0.005 256);

    --muted: oklch(0.34 0.02 264);
    --muted-50:  oklch(0.22 0.02 264);
    --muted-100: oklch(0.26 0.02 264);
    --muted-200: oklch(0.32 0.02 264);
    --muted-300: oklch(0.60 0.025 257);
    --muted-400: oklch(0.55 0.025 257);
    --muted-foreground: oklch(0.68 0.02 257);

    --surface: oklch(0.97 0.005 256);
    --surface-15: oklch(0.97 0.005 256 / 15%);
    --surface-25: oklch(0.97 0.005 256 / 25%);
    --surface-50: oklch(0.97 0.005 256 / 50%);
    --surface-70: oklch(0.97 0.005 256 / 70%);
    --surface-foreground: oklch(0.18 0.02 264);

    --accent: oklch(0.30 0.05 264);
    --accent-200: oklch(0.26 0.03 264);
    --accent-300: oklch(0.34 0.06 264);
    --accent-400: oklch(0.48 0.12 264);
    --accent-foreground: oklch(0.97 0.005 256);

    --success: oklch(0.72 0.16 157);
    --success-200: oklch(0.22 0.06 155);
    --success-300: oklch(0.35 0.10 150);
    --success-400: oklch(0.60 0.14 155);
    --success-foreground: oklch(0.18 0.02 264);

    --destructive: oklch(0.65 0.20 25);
    --destructive-200: oklch(0.22 0.08 25);
    --destructive-300: oklch(0.35 0.12 22);
    --destructive-400: oklch(0.55 0.18 24);
    --destructive-foreground: oklch(0.99 0 0);

    --warning: oklch(0.75 0.15 70);
    --warning-200: oklch(0.25 0.08 65);
    --warning-300: oklch(0.45 0.12 68);
    --warning-400: oklch(0.65 0.14 70);
    --warning-foreground: oklch(0.18 0.02 264);

    --border: oklch(0.97 0.005 256 / 12%);

    --sidebar: oklch(0.22 0.02 264);            /* elevated card on dark canvas */
    --sidebar-foreground: oklch(0.85 0.01 256);
    --sidebar-accent: oklch(0.28 0.02 264);
    --sidebar-accent-foreground: oklch(0.97 0.005 256);
    --sidebar-border: oklch(0.97 0.005 256 / 8%);

    --popover: oklch(0.22 0.02 264);
    --popover-foreground: oklch(0.97 0.005 256);

    --code-surface: oklch(0.16 0.02 264);
    --code-foreground: oklch(0.85 0.01 256);
    --code-muted: oklch(0.55 0.025 257);
  }
```

- [ ] **Step 3: Verify it builds and renders**

Run: `npx tsc -b`
Expected: completes with no errors (CSS change is type-neutral).

Manual: run `yarn dev`, open `http://localhost:3000`. Confirm the landing page and dashboard now read as slate + blue (not brown), and toggle dark mode — both themes look coherent, text is readable (no low-contrast gray-on-gray).

- [ ] **Step 4: Commit**

```bash
git add src/index.css
git commit -m "feat: replace warm-earth palette with Ocean Blue (light + dark)"
```

---

## Task 2: App name + menu groups

**Files:**
- Modify: `src/app-config/appConfig.ts`
- Modify: `src/routes/routes.ts`

- [ ] **Step 1: Add `APP_NAME` to app config**

In `src/app-config/appConfig.ts`, add `APP_NAME` as the first key:

```ts
export const APP_CONFIGURATIONS = {
  APP_NAME: 'Starter',
  TOKEN_KEY: 'token',
  VITE_APP_API_URL: 'http://localhost:3000/api',
} as const;
```

- [ ] **Step 2: Add `group` to the `AppMenu` type**

In `src/routes/routes.ts`, add a `group?` field to the `AppMenu` type (place it right after `name`):

```ts
export type AppMenu = {
  id: string;
  path: string;
  name?: string;
  group?: string;
  permission?: string;
  permissions?: string[];
  roles?: string[];
  icon: ElementType;
  submenu?: AppMenu[];
};
```

- [ ] **Step 3: Tag the menu items with groups**

Replace the `APP_MENU` array with:

```ts
export const APP_MENU: AppMenu[] = [
  {
    id: 'dashboard',
    path: FULL_ROUTES_PATH.HOME.DASHBOARD,
    name: 'Dashboard',
    group: 'Main',
    icon: LayoutDashboard,
  },
  {
    id: 'components',
    path: FULL_ROUTES_PATH.COMPONENTS.INDEX,
    name: 'Components',
    group: 'Main',
    icon: Component,
  },
  {
    id: 'settings',
    path: FULL_ROUTES_PATH.SETTINGS.INDEX,
    name: 'Settings',
    group: 'Account',
    icon: Settings,
  },
];
```

- [ ] **Step 4: Verify**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app-config/appConfig.ts src/routes/routes.ts
git commit -m "feat: add APP_NAME config and group field on app menu"
```

---

## Task 3: Command palette context

**Files:**
- Create: `src/lib/contexts/CommandPaletteContext.tsx`
- Modify: `src/lib/contexts/index.ts`

- [ ] **Step 1: Create the context + provider + global shortcut**

Create `src/lib/contexts/CommandPaletteContext.tsx`:

```tsx
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type CommandPaletteState = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
};

const CommandPaletteContext = createContext<CommandPaletteState | undefined>(undefined);

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((prevState) => !prevState), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggle();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [toggle]);

  const contextValue = useMemo(() => ({ open, setOpen, toggle }), [open, toggle]);

  return <CommandPaletteContext.Provider value={contextValue}>{children}</CommandPaletteContext.Provider>;
}

export const useCommandPalette = () => {
  const context = useContext(CommandPaletteContext);

  if (context === undefined) throw new Error('useCommandPalette must be used within a CommandPaletteProvider');

  return context;
};
```

- [ ] **Step 2: Export from the contexts barrel**

In `src/lib/contexts/index.ts`, add the second line:

```ts
export * from './ThemeContext';
export * from './CommandPaletteContext';
```

- [ ] **Step 3: Verify**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/contexts/CommandPaletteContext.tsx src/lib/contexts/index.ts
git commit -m "feat: add CommandPaletteContext with global cmd+k shortcut"
```

---

## Task 4: CommandPalette component

**Files:**
- Create: `src/components/shared/command-palette/CommandPalette.tsx`
- Create: `src/components/shared/command-palette/index.ts`
- Modify: `src/components/shared/index.ts`

- [ ] **Step 1: Create the CommandPalette**

Create `src/components/shared/command-palette/CommandPalette.tsx`. It uses the repo's `Command.Dialog` (cmdk, chromeless) — NOT PrimeDialog — and adds an `sr-only` `Dialog.Title` for accessibility:

```tsx
import { useNavigate } from 'react-router-dom';

import { Command, Dialog } from '@components/ui';

import { THEME_TYPES, useCommandPalette, useTheme } from '@contexts';
import { useAuth } from '@hooks/shared';

import { APP_MENU } from '@routes';

import { LogOut, Moon, Sun } from 'lucide-react';

function CommandPalette() {
  const navigate = useNavigate();
  const { open, setOpen } = useCommandPalette();
  const { theme, setTheme } = useTheme();
  const { removeCurrentUser } = useAuth();

  const isDark = theme === THEME_TYPES.DARK;

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <Command.Dialog open={open} onOpenChange={setOpen}>
      <Dialog.Title className="sr-only">Command palette</Dialog.Title>

      <Command.Input placeholder="Search or jump to…" />

      <Command.List>
        <Command.Empty when>No results found.</Command.Empty>

        <Command.Group heading="Navigation">
          {APP_MENU.map((route) => (
            <Command.Item key={route.id} value={route.name ?? route.path} onSelect={() => runCommand(() => navigate(route.path))}>
              <route.icon className="h-4 w-4" />
              {route.name ?? route.path}
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Separator />

        <Command.Group heading="Actions">
          <Command.Item
            value="toggle theme dark light"
            onSelect={() => runCommand(() => setTheme(isDark ? THEME_TYPES.LIGHT : THEME_TYPES.DARK))}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            Toggle theme
          </Command.Item>

          <Command.Item value="log out sign out" onSelect={() => runCommand(removeCurrentUser)}>
            <LogOut className="h-4 w-4" />
            Log out
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}

export default CommandPalette;
```

- [ ] **Step 2: Create the component barrel**

Create `src/components/shared/command-palette/index.ts`:

```ts
export { default as CommandPalette } from './CommandPalette';
```

- [ ] **Step 3: Export from the shared barrel**

In `src/components/shared/index.ts`, add at the end:

```ts
export * from './command-palette';
```

- [ ] **Step 4: Verify**

Run: `npx tsc -b`
Expected: no errors. (The palette is not yet mounted; it is wired in Task 8.)

- [ ] **Step 5: Commit**

```bash
git add src/components/shared/command-palette src/components/shared/index.ts
git commit -m "feat: add CommandPalette (cmd+k) built on cmdk Command.Dialog"
```

---

## Task 5: Sidebar link active pill

**Files:**
- Modify: `src/layouts/dashboard-sidebar-link/DashboardSidebarLink.tsx:23-24`

- [ ] **Step 1: Replace the active-style constant**

Replace the `LINK_ACTIVE_STYLES` constant (the multi-line `before:*` version) with a solid blue pill:

```tsx
const LINK_ACTIVE_STYLES = 'bg-primary text-primary-foreground shadow-sm';
```

Leave `LINK_BASE_STYLES` and `LINK_DEFAULT_STYLES` unchanged.

- [ ] **Step 2: Verify**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/layouts/dashboard-sidebar-link/DashboardSidebarLink.tsx
git commit -m "refactor: sidebar active link uses solid blue pill"
```

---

## Task 6: Floating sidebar — brand, groups, profile

**Files:**
- Modify: `src/layouts/dashboard-sidebar/DashboardSidebar.tsx` (full replacement)

- [ ] **Step 1: Replace the sidebar component**

Replace the entire contents of `src/layouts/dashboard-sidebar/DashboardSidebar.tsx` with:

```tsx
import { useMemo, useState } from 'react';

import { Avatar, ScrollArea } from '@components/ui';

import { DashboardSidebarLink, SidebarSubLink, DashboardSidebarDrawer } from '@layouts';

import { useAuth } from '@hooks/shared';

import { cn } from '@utils';
import { APP_MENU, type AppMenu } from '@routes';
import { APP_CONFIGURATIONS } from '@app-config';

const DEFAULT_GROUP = 'Main';

type MenuGroup = { label: string; items: AppMenu[] };

function groupMenu(menu: AppMenu[]): MenuGroup[] {
  const order: string[] = [];
  const map = new Map<string, AppMenu[]>();

  for (const item of menu) {
    const label = item.group ?? DEFAULT_GROUP;

    if (!map.has(label)) {
      map.set(label, []);
      order.push(label);
    }

    map.get(label)!.push(item);
  }

  return order.map((label) => ({ label, items: map.get(label)! }));
}

function DashboardSidebar() {
  const [collapse, setCollapse] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const { currentUser } = useAuth();

  const groups = useMemo(() => groupMenu(APP_MENU), []);

  const handleToggleCollapse = () => setCollapse((prevState) => !prevState);

  const handleToggleMenu = () => {
    setShowMenu((prevState) => !prevState);
    setCollapse(false);
  };

  const renderItem = (route: AppMenu) => {
    if (route.submenu && collapse) {
      return <DashboardSidebarLink key={route.id} route={route} collapse={collapse} onExpandSidebar={() => setCollapse(false)} />;
    }

    if (route.submenu) {
      return <SidebarSubLink key={route.id} route={route} collapse={collapse} />;
    }

    return <DashboardSidebarLink key={route.id} route={route} collapse={collapse} />;
  };

  return (
    <aside
      className={cn(
        'bg-sidebar border-border z-50 w-full shrink-0 rounded-2xl border shadow-sm transition-[width] duration-300 ease-in-out md:relative md:h-full',
        collapse ? 'md:w-17' : 'md:w-65',
      )}
    >
      <div className={cn('flex h-full flex-col', showMenu && 'h-svh')}>
        {/* Brand */}
        <header className="flex h-14 shrink-0 items-center justify-between px-4 md:h-16">
          <div className={cn('flex items-center gap-2.5 overflow-hidden transition-all duration-300', collapse && 'md:w-full md:justify-center')}>
            <span className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold">
              {APP_CONFIGURATIONS.APP_NAME.charAt(0)}
            </span>

            <span className={cn('text-foreground truncate text-sm font-bold transition-all duration-300', collapse && 'md:hidden')}>
              {APP_CONFIGURATIONS.APP_NAME}
            </span>
          </div>

          <DashboardSidebarDrawer variant="mobile" collapse={showMenu} onCollapse={handleToggleMenu} />
        </header>

        {/* Navigation */}
        <ScrollArea
          className={cn(
            'min-h-0 flex-1',
            showMenu ? 'max-h-screen' : 'max-h-0 overflow-hidden md:max-h-none',
            showMenu && 'animate-in slide-in-from-top transition duration-300 ease-out',
          )}
        >
          <nav className="px-3 py-2 md:py-3">
            {groups.map((group) => (
              <div key={group.label} className="mb-2 space-y-0.5">
                <p
                  className={cn(
                    'text-muted-foreground px-3 pt-2 pb-1 text-[10px] font-semibold tracking-wider uppercase',
                    collapse && 'md:sr-only',
                  )}
                >
                  {group.label}
                </p>

                {group.items.map(renderItem)}
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* User profile */}
        <div className="border-border shrink-0 border-t p-3">
          <div className={cn('flex items-center gap-3 rounded-lg px-2 py-1.5', collapse && 'md:justify-center md:px-0')}>
            <Avatar className="h-8 w-8 shrink-0">
              {!!currentUser?.picture && <Avatar.Image src={currentUser.picture} alt="User avatar" />}

              <Avatar.Fallback className="bg-primary/10 text-primary text-xs font-medium">
                {currentUser?.name?.charAt(0)?.toUpperCase()}
              </Avatar.Fallback>
            </Avatar>

            <div className={cn('min-w-0 flex-1', collapse && 'md:hidden')}>
              <p className="text-foreground truncate text-sm font-medium">{currentUser?.name}</p>

              <p className="text-muted-foreground truncate text-xs">{currentUser?.email}</p>
            </div>
          </div>
        </div>

        {/* Collapse toggle */}
        <DashboardSidebarDrawer collapse={!collapse} onCollapse={handleToggleCollapse} />
      </div>
    </aside>
  );
}

export default DashboardSidebar;
```

- [ ] **Step 2: Verify**

Run: `npx tsc -b`
Expected: no errors.

Manual (after Task 8 mounts the inset layout, re-check): brand mark + "Starter" wordmark show; nav is grouped under "Main" / "Account"; the active route is a solid blue pill; the user profile sits at the bottom; collapsing hides labels/wordmark and centers icons.

- [ ] **Step 3: Commit**

```bash
git add src/layouts/dashboard-sidebar/DashboardSidebar.tsx
git commit -m "feat: floating sidebar with brand, grouped nav, and user profile"
```

---

## Task 7: Header — ⌘K command trigger

**Files:**
- Modify: `src/layouts/dashboard-header/DashboardHeader.tsx` (full replacement)

- [ ] **Step 1: Replace the header component**

Replace the entire contents of `src/layouts/dashboard-header/DashboardHeader.tsx` with (the right-side avatar `DropdownMenu` is unchanged from the original; the empty left section + Help icon are replaced by the command trigger):

```tsx
import { useNavigate } from 'react-router-dom';

import { Avatar, Button, DropdownMenu } from '@components/ui';
import { Conditional } from '@components/utils';
import { ThemeSwitcher } from '@components/shared';

import { useCommandPalette } from '@contexts';
import { useAuth } from '@hooks/shared';

import { FULL_ROUTES_PATH } from '@routes';

import { Bell, LogOut, Search, Settings, User } from 'lucide-react';

function DashboardHeader() {
  const navigate = useNavigate();
  const { currentUser, removeCurrentUser } = useAuth();
  const { toggle } = useCommandPalette();

  const handleNavigateToProfile = () => {
    if (!currentUser?.userId) return;
    navigate(FULL_ROUTES_PATH.HOME.INDEX);
  };

  return (
    <header className="bg-background/80 supports-backdrop-filter:bg-background/60 border-muted-200 sticky top-0 z-40 flex h-14 w-full shrink-0 items-center justify-between gap-3 border-b px-4 backdrop-blur-xl md:px-6">
      {/* Command palette trigger */}
      <button
        type="button"
        onClick={toggle}
        aria-label="Open command palette"
        className="text-muted-foreground bg-secondary border-border hover:bg-accent hover:text-foreground flex h-9 w-full max-w-xs items-center gap-2 rounded-lg border px-3 text-sm transition-colors"
      >
        <Search className="h-4 w-4 shrink-0" />

        <span className="flex-1 text-start">Search or jump to…</span>

        <kbd className="bg-background text-muted-foreground border-border pointer-events-none hidden rounded border px-1.5 font-mono text-[10px] sm:inline-block">
          ⌘K
        </kbd>
      </button>

      {/* Right Section: Actions */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative h-9 w-9" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>

        {/* Theme Switcher */}
        <ThemeSwitcher />

        {/* Separator */}
        <div className="bg-border mx-1 hidden h-5 w-px md:block" />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenu.Trigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0" aria-label="Open user menu">
              <Avatar className="ring-primary/20 h-8 w-8 ring-2 transition-all hover:ring-2">
                <Conditional.If condition={!!currentUser?.picture}>
                  <Avatar.Image src={currentUser?.picture} alt="User avatar" />
                </Conditional.If>

                <Avatar.Fallback className="bg-primary/10 text-primary text-xs font-medium">
                  <Conditional>
                    <Conditional.If condition={!!currentUser?.name}>
                      {currentUser?.name?.charAt(0)?.toUpperCase()}
                    </Conditional.If>

                    <Conditional.Else>
                      <User className="h-3.5 w-3.5" />
                    </Conditional.Else>
                  </Conditional>
                </Avatar.Fallback>
              </Avatar>
            </Button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Content className="w-56" align="end" forceMount>
            <DropdownMenu.Label className="font-normal">
              <div className="flex flex-col gap-1">
                <p className="text-sm leading-none font-medium">{currentUser?.name}</p>

                <p className="text-muted text-xs leading-none">{currentUser?.email}</p>
              </div>
            </DropdownMenu.Label>

            <DropdownMenu.Separator />

            <DropdownMenu.Group>
              <DropdownMenu.Item onClick={handleNavigateToProfile}>
                <User className="me-2 h-4 w-4" />
                My profile
              </DropdownMenu.Item>

              <DropdownMenu.Item>
                <Settings className="me-2 h-4 w-4" />
                Settings
              </DropdownMenu.Item>
            </DropdownMenu.Group>

            <DropdownMenu.Separator />

            <DropdownMenu.Item onClick={removeCurrentUser}>
              <LogOut className="me-2 h-4 w-4" />
              Log out
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default DashboardHeader;
```

- [ ] **Step 2: Verify**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/layouts/dashboard-header/DashboardHeader.tsx
git commit -m "feat: header command trigger (cmd+k) replacing empty left section"
```

---

## Task 8: Inset layout + provider + palette mount

**Files:**
- Modify: `src/layouts/dashboard-layout/DashboardLayout.tsx` (full replacement)

- [ ] **Step 1: Replace the layout**

Replace the entire contents of `src/layouts/dashboard-layout/DashboardLayout.tsx` with:

```tsx
import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { CommandPalette, PrimeLoader, Toaster } from '@components/shared';

import { CommandPaletteProvider } from '@contexts';

import { DashboardHeader, DashboardSidebar } from '@layouts';

function DashboardLayout() {
  return (
    <CommandPaletteProvider>
      <div className="bg-secondary flex h-dvh flex-col gap-2 overflow-hidden p-2 md:flex-row">
        <DashboardSidebar />

        <div className="bg-background border-border flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border shadow-sm">
          <DashboardHeader />

          <main className="flex-1 overflow-x-hidden overflow-y-auto">
            <Suspense fallback={<PrimeLoader />}>
              <Outlet />
            </Suspense>
          </main>
        </div>

        <Toaster />

        <CommandPalette />
      </div>
    </CommandPaletteProvider>
  );
}

export default DashboardLayout;
```

- [ ] **Step 2: Verify build + interaction**

Run: `npx tsc -b`
Expected: no errors.

Manual (`yarn dev`, go to `/dashboard`):
- Sidebar and content render as two floating rounded cards on a slate canvas with a gap.
- Press `⌘K` (mac) / `Ctrl+K` (win/linux) → palette opens; typing filters; selecting a Navigation item routes and closes; "Toggle theme" flips light/dark; `Esc` closes.
- Click the header search button → same palette opens.
- Check mobile width: sidebar mobile menu toggle still works.

- [ ] **Step 3: Commit**

```bash
git add src/layouts/dashboard-layout/DashboardLayout.tsx
git commit -m "feat: inset dashboard layout with command palette provider"
```

---

## Task 9: Sample dashboard page

**Files:**
- Create: `src/pages/dashboard/DashboardPage.tsx`
- Modify: `src/routes/router.tsx`

- [ ] **Step 1: Create the dashboard page**

Create `src/pages/dashboard/DashboardPage.tsx`:

```tsx
import { type ElementType } from 'react';

import { Card } from '@components/ui';

import { cn } from '@utils';

import { Activity, ArrowDownRight, ArrowUpRight, DollarSign, TrendingUp, Users } from 'lucide-react';

type Stat = { label: string; value: string; delta: number; icon: ElementType };

const STATS: Stat[] = [
  { label: 'Total Users', value: '12,840', delta: 12.5, icon: Users },
  { label: 'Revenue', value: '$48,210', delta: 8.2, icon: DollarSign },
  { label: 'Active Sessions', value: '2,318', delta: -3.1, icon: Activity },
  { label: 'Conversion', value: '4.7%', delta: 1.4, icon: TrendingUp },
];

const CHART_DATA = [32, 40, 35, 50, 49, 60, 70, 65, 72, 80, 76, 92];

const ACTIVITY = [
  { id: 1, name: 'Sarah Chen', action: 'created a new project', time: '2m ago' },
  { id: 2, name: 'Alex Morgan', action: 'commented on Design Review', time: '18m ago' },
  { id: 3, name: 'Jordan Lee', action: 'merged pull request #142', time: '1h ago' },
  { id: 4, name: 'Taylor Kim', action: 'updated billing settings', time: '3h ago' },
  { id: 5, name: 'Chris Park', action: 'invited 3 team members', time: '5h ago' },
];

function StatCard({ stat }: { stat: Stat }) {
  const positive = stat.delta >= 0;

  return (
    <Card className="border-border border">
      <Card.Content className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">{stat.label}</span>

          <span className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <stat.icon className="h-4 w-4" />
          </span>
        </div>

        <div className="flex items-end justify-between">
          <span className="text-foreground text-2xl font-bold">{stat.value}</span>

          <span className={cn('flex items-center gap-0.5 text-xs font-medium', positive ? 'text-success' : 'text-destructive')}>
            {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {Math.abs(stat.delta)}%
          </span>
        </div>
      </Card.Content>
    </Card>
  );
}

function AreaChart({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = 100 / (data.length - 1);

  const toY = (value: number) => 38 - ((value - min) / range) * 34;
  const linePoints = data.map((value, index) => `${index * stepX},${toY(value)}`).join(' ');
  const areaPath = `M0,40 L${data.map((value, index) => `${index * stepX},${toY(value)}`).join(' L')} L100,40 Z`;

  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-48 w-full" role="img" aria-label="Revenue trend">
      <defs>
        <linearGradient id="dashboard-area-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={areaPath} fill="url(#dashboard-area-fill)" />

      <polyline
        points={linePoints}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function ActivityList() {
  return (
    <ul className="flex flex-col">
      {ACTIVITY.map((item) => (
        <li key={item.id} className="border-border flex items-center gap-3 py-3 not-last:border-b">
          <span className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
            {item.name.charAt(0)}
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-foreground truncate text-sm">
              <span className="font-medium">{item.name}</span> {item.action}
            </p>
          </div>

          <span className="text-muted-foreground shrink-0 text-xs">{item.time}</span>
        </li>
      ))}
    </ul>
  );
}

function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-foreground text-2xl font-bold">Dashboard</h1>

        <p className="text-muted-foreground text-sm">Welcome back, here's what's happening.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-border border lg:col-span-2">
          <Card.Header>
            <Card.Title className="text-base">Revenue overview</Card.Title>

            <Card.Description>Last 12 months</Card.Description>
          </Card.Header>

          <Card.Content>
            <AreaChart data={CHART_DATA} />
          </Card.Content>
        </Card>

        <Card className="border-border border">
          <Card.Header>
            <Card.Title className="text-base">Recent activity</Card.Title>
          </Card.Header>

          <Card.Content className="py-0">
            <ActivityList />
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}

export default DashboardPage;
```

- [ ] **Step 2: Wire the route**

In `src/routes/router.tsx`, add the lazy import alongside the other page imports:

```tsx
const DashboardPage = lazy(() => import('@pages/dashboard/DashboardPage'));
```

Then replace the dashboard route element:

```tsx
          {
            path: FULL_ROUTES_PATH.HOME.DASHBOARD,
            element: <DashboardPage />,
          },
```

(The `DashboardLayout` `<main>` already wraps the `Outlet` in `<Suspense fallback={<PrimeLoader />}>`, so the lazy page needs no extra Suspense.)

- [ ] **Step 3: Verify**

Run: `npx tsc -b`
Expected: no errors.

Manual (`yarn dev`, `/dashboard`): four stat cards (green/red deltas), a blue gradient area chart that scales with width, and a recent-activity list. Confirm in dark mode too.

- [ ] **Step 4: Commit**

```bash
git add src/pages/dashboard/DashboardPage.tsx src/routes/router.tsx
git commit -m "feat: add sample dashboard page with stats, chart, and activity"
```

---

## Task 10: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Type check + production build**

Run: `yarn build`
Expected: `tsc -b` passes and `vite build` completes with no errors.

- [ ] **Step 2: Lint**

Run: `yarn lint`
Expected: no new errors in the changed files.

- [ ] **Step 3: Manual acceptance pass** (`yarn dev`)

- [ ] Landing page (`/`): slate + blue, readable, both light and dark.
- [ ] Dashboard (`/dashboard`): floating sidebar + content cards on slate canvas.
- [ ] Sidebar: brand mark + name, grouped nav (Main / Account), solid-blue active pill, bottom profile; collapse hides labels and centers icons; mobile menu toggle works.
- [ ] Header: command trigger shows "Search or jump to…" + ⌘K; right-side bell, theme switch, avatar menu.
- [ ] ⌘K palette: opens via shortcut and via header button; filters; Navigation routes + closes; Toggle theme works; Log out item present; `Esc` closes.
- [ ] Dashboard page: 4 stat cards, scalable SVG chart, activity list — light + dark.
- [ ] RTL spot check (set `dir="rtl"` on `<html>` in devtools): sidebar border/profile and header layout mirror correctly.

- [ ] **Step 4: Final commit (if any tweaks were needed)**

```bash
git add -A
git commit -m "fix: dashboard redesign polish from verification pass"
```

---

## Self-Review (author checklist — completed)

- **Spec coverage:** §5.1 palette → Task 1; §5.5 menu groups + app name → Task 2; §5.3 context/shortcut → Task 3; §5.3 CommandPalette → Task 4; §5.2 active pill → Task 5; §5.2 floating sidebar/brand/profile → Task 6; §5.3 header trigger → Task 7; §5.2 inset layout + mount → Task 8; §5.4 dashboard page + routing → Task 9; §8 verification → Task 10. All covered.
- **Placeholders:** none — every code step is complete.
- **Type/name consistency:** `useCommandPalette` (`open`/`setOpen`/`toggle`), `CommandPaletteProvider`, `CommandPalette`, `APP_CONFIGURATIONS.APP_NAME`, `AppMenu.group`, and the `Command.*` / `Card.*` / `Dialog.Title` APIs all match the files they are used in.
- **Decisions honored:** palette app-wide; floating/inset sidebar; functional ⌘K; sample page; command palette uses `Command.Dialog` (not PrimeDialog) per the resolved dialog-component question.
```
