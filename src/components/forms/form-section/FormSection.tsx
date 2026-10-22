'use client';

import { type ComponentPropsWithoutRef, type FC, type ReactNode } from 'react';

import { Conditional } from '@components/utils';

import { cn } from '@utils';

type FormSectionProps = Omit<ComponentPropsWithoutRef<'section'>, 'title'> & {
  title?: ReactNode;
  description?: ReactNode;
};

/** A titled group of fields; consecutive sections are separated by a hairline. */
const FormSection: FC<FormSectionProps> = ({ className, title, description, children, ...props }) => (
  <section
    data-slot="form-section"
    className={cn('border-border-subtle flex flex-col gap-4 [&+&]:border-t [&+&]:pt-6', className)}
    {...props}
  >
    <Conditional.If condition={!!title || !!description}>
      <header data-slot="form-section-header" className="flex flex-col gap-1">
        <Conditional.If condition={!!title}>
          <h3 className="text-fg text-md font-semibold">{title}</h3>
        </Conditional.If>

        <Conditional.If condition={!!description}>
          <p className="text-fg-muted text-sm">{description}</p>
        </Conditional.If>
      </header>
    </Conditional.If>

    <div data-slot="form-section-content" className="grid gap-4">
      {children}
    </div>
  </section>
);

FormSection.displayName = 'FormSection';

export default FormSection;
