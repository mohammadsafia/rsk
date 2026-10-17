import { type ComponentPropsWithoutRef, type FC, type MouseEventHandler, type ReactNode } from 'react';

import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

import { X } from 'lucide-react';

export const tagVariants = cva('bg-surface inline-flex shrink-0 items-center gap-1 rounded-md border font-medium whitespace-nowrap', {
  variants: {
    tone: {
      neutral: 'border-border text-fg',
      accent: 'border-border text-accent',
      success: 'border-border text-success',
      warning: 'border-border text-warning',
      danger: 'border-border text-danger',
      info: 'border-border text-info',
    },
    size: {
      sm: 'h-5 px-1.5 text-2xs',
      md: 'h-6 px-2 text-xs',
    },
    interactive: {
      true: 'focus-ring cursor-pointer hover:bg-hover',
      false: '',
    },
    selected: {
      true: 'border-fg text-fg ink',
      false: '',
    },
    removable: {
      true: 'pe-0.5',
      false: '',
    },
  },
  defaultVariants: {
    tone: 'neutral',
    size: 'md',
    interactive: false,
    selected: false,
    removable: false,
  },
});

type TagBaseProps = Omit<ComponentPropsWithoutRef<'span'>, 'onClick'> &
  Pick<VariantProps<typeof tagVariants>, 'tone' | 'size'> & {
    children: ReactNode;
  };

type ToggleTagProps = TagBaseProps & {
  onClick?: MouseEventHandler<HTMLButtonElement>;
  selected?: boolean;
  onRemove?: never;
  label?: never;
};

type RemovableTagProps = TagBaseProps & {
  onRemove: () => void;
  /** Names the remove button when children are not plain text. */
  label?: string;
  onClick?: never;
  selected?: never;
};

export type TagProps = ToggleTagProps | RemovableTagProps;

const Tag: FC<TagProps> = ({ className, tone, size, children, onClick, selected, onRemove, label, ...props }) => {
  const { t } = useAppTranslation('common');

  const itemName = label ?? (typeof children === 'string' ? children : undefined);
  const removeLabel = itemName ? t('removeItem', { item: itemName }) : t('remove');
  const isToggle = Boolean(onClick);

  const classes = cn(
    tagVariants({ tone, size, interactive: isToggle, selected: Boolean(selected), removable: Boolean(onRemove) }),
    className,
  );

  return (
    <Conditional>
      <Conditional.If condition={isToggle}>
        <button
          type="button"
          data-slot="tag"
          aria-pressed={selected}
          onClick={onClick}
          className={classes}
          {...(props as ComponentPropsWithoutRef<'button'>)}
        >
          {children}
        </button>
      </Conditional.If>

      <Conditional.Else>
        <span data-slot="tag" className={classes} {...props}>
          {children}

          <Conditional.If condition={Boolean(onRemove)}>
            <button
              type="button"
              data-slot="tag-remove"
              aria-label={removeLabel}
              onClick={onRemove}
              className="focus-ring text-fg-muted hover:bg-hover hover:text-fg inline-flex size-4 items-center justify-center rounded-sm"
            >
              <X aria-hidden="true" className="size-3" />
            </button>
          </Conditional.If>
        </span>
      </Conditional.Else>
    </Conditional>
  );
};

export default Tag;
