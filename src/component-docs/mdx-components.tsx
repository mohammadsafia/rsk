import { type ComponentPropsWithoutRef } from 'react';
import { Link } from 'react-router';

import Table from '@components/ui/table/Table';
import { CodeBlock } from '@component-docs';
import { Callout, DoDont, Example, PropsTable } from '@component-docs/blocks';

import { cn } from '@utils';

import type { MDXComponents } from 'mdx/types';

/** Components every docs MDX page can use without importing them, plus the prose element overrides. */
export const mdxComponents: MDXComponents = {
  Example,
  PropsTable,
  Callout,
  DoDont,
  pre: (props: ComponentPropsWithoutRef<'pre'>) => <CodeBlock {...props} />,
  // A link to a page of this site goes through the router, so it keeps the base path the site is served under (/rsk/
  // on GitHub Pages) and doesn't reload the page. External links and #anchors stay plain.
  a: ({ href = '', ...props }: ComponentPropsWithoutRef<'a'>) =>
    href.startsWith('/') && !href.startsWith('//') ? <Link to={href} {...props} /> : <a href={href} {...props} />,
  // Inline code (block code is wrapped by CodeBlock's LTR <pre>): keep identifiers left-to-right inside Arabic prose.
  code: ({ className, ...props }: ComponentPropsWithoutRef<'code'>) => (
    <code dir="ltr" className={cn('font-mono text-sm', className)} {...props} />
  ),
  table: (props: ComponentPropsWithoutRef<'table'>) => (
    <div tabIndex={0} className="focus-ring not-prose border-border my-6 overflow-x-auto rounded-lg border">
      <Table {...props} />
    </div>
  ),
  thead: (props: ComponentPropsWithoutRef<'thead'>) => <Table.Header {...props} />,
  tbody: (props: ComponentPropsWithoutRef<'tbody'>) => <Table.Body {...props} />,
  tr: (props: ComponentPropsWithoutRef<'tr'>) => <Table.Row {...props} />,
  th: (props: ComponentPropsWithoutRef<'th'>) => <Table.Head {...props} />,
  td: (props: ComponentPropsWithoutRef<'td'>) => <Table.Cell {...props} />,
};
