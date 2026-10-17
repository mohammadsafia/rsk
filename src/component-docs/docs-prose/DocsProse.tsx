import type { ReactNode } from 'react';

import { cn } from '@utils';

// Prose styles for the MDX body. Only the page's own elements (direct children) are styled, so the
// components rendered inside an Example keep their own typography. The typography plugin is not used.
const PROSE = cn(
  'text-fg text-base leading-6 [&>*+*]:mt-4',
  '[&>h2]:text-fg [&>h2]:mt-12 [&>h2]:mb-3 [&>h2]:scroll-mt-24 [&>h2]:text-xl [&>h2]:font-semibold [&>h2]:tracking-tight rtl:[&>h2]:tracking-normal [&>h2:first-child]:mt-0',
  '[&>h3]:text-fg [&>h3]:mt-8 [&>h3]:mb-2 [&>h3]:scroll-mt-24 [&>h3]:text-md [&>h3]:font-semibold',
  '[&>p]:text-fg-muted [&>ul]:text-fg-muted [&>ol]:text-fg-muted',
  '[&>ul]:list-disc [&>ul]:ps-5 [&>ol]:list-decimal [&>ol]:ps-5 [&>ul>li]:my-1.5 [&>ol>li]:my-1.5 [&>ul>li]:ps-1 [&>ol>li]:ps-1',
  '[&>p_strong]:text-fg [&>ul_strong]:text-fg [&>ol_strong]:text-fg [&_strong]:font-semibold',
  // Underlined, not told apart by colour alone (WCAG 1.4.1).
  '[&>p_a]:text-accent [&>ul_a]:text-accent [&>ol_a]:text-accent [&>p_a]:underline [&>ul_a]:underline [&>ol_a]:underline [&>p_a]:underline-offset-4 [&>ul_a]:underline-offset-4 [&>ol_a]:underline-offset-4',
  '[&>blockquote]:bg-surface-sunken [&>blockquote]:text-fg-muted [&>blockquote]:rounded-md [&>blockquote]:px-4 [&>blockquote]:py-3',
);

export function DocsProse({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div data-slot="docs-prose" className={PROSE}>
      {children}
    </div>
  );
}
