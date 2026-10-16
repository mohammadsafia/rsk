import { type ReactNode, useId } from 'react';

import { Conditional } from '@components/utils';

import { cn } from '@utils';

type SectionProps = {
  id?: string;
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
  children?: ReactNode;
};

function Section({ id, eyebrow, title, description, className, children }: SectionProps) {
  const titleId = useId();

  return (
    <section id={id} aria-labelledby={titleId} className="border-border-subtle border-t">
      <div className={cn('mx-auto max-w-6xl px-4 py-14 md:px-6', className)}>
        <p className="text-fg-muted font-mono text-xs font-medium tracking-wider uppercase">{eyebrow}</p>

        <h2 id={titleId} className="text-fg mt-2 text-2xl font-semibold tracking-tight rtl:leading-snug">
          {title}
        </h2>

        <Conditional.If condition={!!description}>
          <p className="text-fg-muted mt-2 max-w-prose text-base">{description}</p>
        </Conditional.If>

        {children}
      </div>
    </section>
  );
}

export default Section;
