import type { ComponentType } from 'react';

export type DocComponent = ComponentType<Record<string, unknown>>;

export type DocHeading = Readonly<{ depth: 2 | 3; text: string; slug: string }>;

export type ComponentDocEntry = Readonly<{
  id: string;
  title: string;
  section: string;
  category: string;
  description: string;
  tags?: string[];
  /** Guides: position in the Getting started group. */
  order?: number;
  /** Overrides the import path shown in the page header. */
  importFrom?: string;
  headings: ReadonlyArray<DocHeading>;
  load: () => Promise<{ default: DocComponent }>;
}>;

export type Frontmatter = Readonly<{
  order?: number;
  importFrom?: string;
  id?: string;
  title?: string;
  section?: string;
  category?: string;
  description?: string;
  tags?: string[];
}>;

export type MdxModule = Readonly<{
  default: ComponentType;
  frontmatter?: Frontmatter;
}>;
