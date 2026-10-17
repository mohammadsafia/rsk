---
id: {{id}}
title: {{title}}
section: Components
category: {{category}}
description: {{description}}
tags: [{{tagsInline}}]
---

import { {{componentName}} } from '{{importPath}}';

## Basic

One sentence on when to use it. The Example's Code tab shows its own source, so there is no separate Code section.

<Example title="Basic">
  <{{componentName}} />
</Example>

## Variants

<Example title="Variants">
  <{{componentName}} />
</Example>

## API

<PropsTable
  rows={[
    { prop: 'className', type: 'string', description: 'Merged with cn; style with semantic tokens (bg-surface, text-fg-muted), never palette or legacy names.' },
  ]}
/>

## Accessibility

- Role, keyboard support and labelling, as implemented in the source.

## RTL notes

- Mirrored icons, logical spacing, LTR-isolated values, or "No direction-specific behaviour".
