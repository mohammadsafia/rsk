import type { ReactNode } from 'react';

export type ComponentDoc = {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  demo?: ReactNode;
  code?: string;
  imports?: string;
  props?: Array<{ name: string; type?: string; required?: boolean; description?: string }>;
};
