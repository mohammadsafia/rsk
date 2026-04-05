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
  };

  const MDXComponent: ComponentType<{ components?: MDXComponents }>;
  export default MDXComponent;
}
