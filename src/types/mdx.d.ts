declare module '*.mdx' {
  import type { ComponentType } from 'react';
  import type { MDXComponents } from 'mdx/types';

  export const frontmatter: {
    id?: string;
    title?: string;
    section?: string;
    category?: string;
    tags?: string[];
    description?: string;
    order?: number;
    importFrom?: string;
  };

  /** h2/h3 headings, injected at build time by scripts/docs/remark-docs.ts. */
  export const headings: ReadonlyArray<{ depth: 2 | 3; text: string; slug: string }>;

  const MDXComponent: ComponentType<{ components?: MDXComponents }>;
  export default MDXComponent;
}
