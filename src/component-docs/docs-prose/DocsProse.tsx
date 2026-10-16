import type { ReactNode } from 'react';

type DocsProseProps = Readonly<{
  children: ReactNode;
  variant?: 'page' | 'panel';
}>;

const variantStyles = {
  page: 'mx-auto w-full max-w-4xl px-6 py-10',
  panel: 'w-full px-8 py-8',
} as const;

export function DocsProse({ children, variant = 'page' }: DocsProseProps) {
  return (
    <div className={variantStyles[variant]}>
      <main className="prose prose-headings:scroll-mt-24 max-w-none space-y-5">{children}</main>
    </div>
  );
}
