---
id: {{id}}
title: {{title}}
section: Components
category: {{category}}
description: {{description}}
tags: [{{tagsInline}}]
---

import { {{componentName}} } from '{{importPath}}';

## Demo

<div className="flex w-full flex-col gap-6">
  <{{componentName}} />
</div>

## Imports

```tsx
import { {{componentName}} } from '{{importPath}}';
```

## Code

```tsx
<{{componentName}} />
```

## API

| Prop | Type | Default | Notes |
|---|---|---|---|
| `className` | `string` | — | Merged with `cn`; style with semantic tokens (`bg-surface`, `text-fg-muted`), never palette or legacy names. |

## Conventions

- Every part sets `data-slot`; JSX branches use `Conditional`; copy comes from i18n (EN and AR).
