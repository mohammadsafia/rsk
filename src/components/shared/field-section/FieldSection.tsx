import { type ComponentPropsWithoutRef, createContext, type FC, useContext } from 'react';

import { Divider, type DividerProps } from '@components/ui';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

type FieldSectionHeaderProps = ComponentPropsWithoutRef<'header'>;

type FieldSectionDividerProps = DividerProps;

type FieldSectionContentProps = ComponentPropsWithoutRef<'div'>;

type FieldSectionProps = ComponentPropsWithoutRef<'section'> & VariantProps<typeof fieldSectionHeaderVariants>;

type FieldSectionComponent = FC<FieldSectionProps> & {
  Header: FC<FieldSectionHeaderProps>;
  Divider: FC<FieldSectionDividerProps>;
  Content: FC<FieldSectionContentProps>;
};

type FieldSectionContextValue = VariantProps<typeof fieldSectionHeaderVariants>;

const fieldSectionHeaderVariants = cva('text-sm', {
  variants: {
    variant: {
      default: 'text-foreground font-medium',
      primary: 'text-primary font-medium',
      secondary: 'text-secondary font-medium',
      subtle: 'text-muted-400',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const FieldSectionContext = createContext<FieldSectionContextValue | null>(null);

const useFieldSectionContext = () => {
  const context = useContext(FieldSectionContext);

  if (!context) throw new Error('FieldSection subcomponents must be used within <FieldSection>');

  return context;
};

const FieldSectionHeader: FC<FieldSectionHeaderProps> = ({ className, children, ...props }) => {
  const { variant } = useFieldSectionContext();

  return (
    <header
      data-slot="field-section-header"
      className={cn('flex items-center gap-2', fieldSectionHeaderVariants({ variant }), className)}
      {...props}
    >
      {children}
    </header>
  );
};

const FieldSectionDivider: FC<FieldSectionDividerProps> = ({ className, variant = 'dashed', ...props }) => (
  <Divider variant={variant} className={cn('w-auto grow', className)} {...props} />
);

const FieldSectionContent: FC<FieldSectionContentProps> = ({ className, children, ...props }) => (
  <div data-slot="field-section-content" className={className} {...props}>
    {children}
  </div>
);

const FieldSection: FieldSectionComponent = ({ variant = 'default', className, children, ...props }) => (
  <FieldSectionContext.Provider value={{ variant }}>
    <section data-slot="field-section" className={cn('flex flex-col gap-3', className)} {...props}>
      {children}
    </section>
  </FieldSectionContext.Provider>
);

FieldSection.Header = FieldSectionHeader;
FieldSection.Divider = FieldSectionDivider;
FieldSection.Content = FieldSectionContent;

FieldSectionHeader.displayName = 'FieldSectionHeader';
FieldSectionDivider.displayName = 'FieldSectionDivider';
FieldSectionContent.displayName = 'FieldSectionContent';
FieldSection.displayName = 'FieldSection';

export default FieldSection;
