import type { ComponentType } from 'react';

export type DocComponent = ComponentType<Record<string, unknown>>;

export type ComponentDocEntry = Readonly<{
  id: string;
  title: string;
  section: string;
  category: string;
  description: string;
  tags?: string[];
  load: () => Promise<{ default: DocComponent }>;
}>;

export type Frontmatter = Readonly<{
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