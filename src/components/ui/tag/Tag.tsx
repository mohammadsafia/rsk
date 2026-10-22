'use client';

import { type ComponentPropsWithoutRef, type FC, type MouseEventHandler, type ReactNode, useRef } from 'react';

import { Conditional } from '@components/utils';

import { LEAVE_TIMING, useLeave } from '@hooks/motion';
import { useAppTranslation } from '@hooks/shared';

import { type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

import { X } from 'lucide-react';

import { tagVariants } from './variants';

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

/** The tag folds shut (width, padding, border, opacity) so its neighbours close the gap instead of jumping. */
const collapse = (tag: HTMLElement) => [
  tag.animate(
    [
      { width: `${tag.offsetWidth}px`, opacity: 1, overflow: 'hidden' },
      { width: '0px', paddingInline: '0px', borderInlineWidth: '0px', opacity: 0, overflow: 'hidden' },
    ],
    LEAVE_TIMING,
  ),
];

const Tag: FC<TagProps> = ({ className, tone, size, children, onClick, selected, onRemove, label, ...props }) => {
  const { t } = useAppTranslation('common');

  const itemName = label ?? (typeof children === 'string' ? children : undefined);
  const removeLabel = itemName ? t('removeItem', { item: itemName }) : t('remove');
  const isToggle = Boolean(onClick);
  const tagRef = useRef<HTMLSpanElement>(null);
  const leave = useLeave(tagRef, collapse);

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
        <span ref={tagRef} data-slot="tag" className={classes} {...props}>
          {children}

          <Conditional.If condition={Boolean(onRemove)}>
            <button
              type="button"
              data-slot="tag-remove"
              aria-label={removeLabel}
              onClick={() => onRemove && leave(onRemove)}
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
