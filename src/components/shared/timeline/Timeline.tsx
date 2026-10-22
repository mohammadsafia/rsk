'use client';

import { Children, type ComponentPropsWithoutRef, type FC, type ReactNode } from 'react';

import { Button, Skeleton, Tooltip } from '@components/ui';
import { EmptyState } from '@components/ui';
import { Conditional } from '@components/utils';

import { type DateInput, useAppTranslation, useDate } from '@hooks/shared';

import { cn } from '@utils';

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

const DOT: Record<Tone, string> = {
  neutral: 'bg-fg-muted',
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
};

export type TimelineProps = ComponentPropsWithoutRef<'ol'> & {
  loading?: boolean;
  empty?: ReactNode;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
};

export type TimelineItemProps = Omit<ComponentPropsWithoutRef<'li'>, 'title'> & {
  title: ReactNode;
  time?: DateInput;
  meta?: ReactNode;
  icon?: ReactNode;
  avatar?: ReactNode;
  tone?: Tone;
};

type TimelineGroupProps = ComponentPropsWithoutRef<'li'> & { label: ReactNode };

type TimelineComponent = FC<TimelineProps> & { Item: FC<TimelineItemProps>; Group: FC<TimelineGroupProps> };

const Item: FC<TimelineItemProps> = ({ title, time, meta, icon, avatar, tone = 'neutral', className, children, ...props }) => {
  const { getTimeAgo, isValid, toDate, formatDate, constants } = useDate();
  const hasTime = time !== undefined && isValid(time);

  return (
    <li
      data-slot="timeline-item"
      className={cn(
        'relative flex gap-3 pb-5 last:pb-0',
        'before:bg-border-subtle before:absolute before:start-3 before:top-7 before:-bottom-0 before:w-px last:before:hidden',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="bg-surface border-border relative z-10 grid size-6 shrink-0 place-items-center rounded-full border [&_svg]:size-3.5"
      >
        <Conditional>
          <Conditional.If condition={!!avatar}>{avatar}</Conditional.If>
          <Conditional.If condition={!!icon}>
            <span className="text-fg-muted">{icon}</span>
          </Conditional.If>
          <Conditional.Else>
            <span className={cn('size-2 rounded-full', DOT[tone])} />
          </Conditional.Else>
        </Conditional>
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-fg text-sm font-medium">{title}</span>
          <Conditional.If condition={!!meta}>
            <span className="text-fg-muted text-xs">{meta}</span>
          </Conditional.If>
          <Conditional.If condition={hasTime}>
            <Tooltip content={hasTime ? formatDate(time, constants.DateFormats.SHORT_MONTH_DAY_YEAR_TIME) : ''}>
              {/* A button, so the full date in the tooltip is reachable by keyboard. */}
              <button type="button" className="text-fg-muted focus-ring ms-auto rounded-sm text-xs">
                <time dateTime={hasTime ? toDate(time, constants.DateFormats.ISO_DATETIME) : undefined}>
                  {hasTime ? getTimeAgo(time) : ''}
                </time>
              </button>
            </Tooltip>
          </Conditional.If>
        </div>
        <Conditional.If condition={!!children}>
          <div className="text-fg-muted text-sm">{children}</div>
        </Conditional.If>
      </div>
    </li>
  );
};

const Group: FC<TimelineGroupProps> = ({ label, className, children, ...props }) => (
  <li data-slot="timeline-group" className={cn('flex flex-col gap-3 pb-6 last:pb-0', className)} {...props}>
    <h3 className="text-fg-muted text-xs font-medium tracking-wider uppercase rtl:tracking-normal">{label}</h3>
    <ol className="flex flex-col">{children}</ol>
  </li>
);

const Timeline: TimelineComponent = ({
  loading = false,
  empty,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
  className,
  children,
  ...props
}) => {
  const { t } = useAppTranslation('common');
  // A mapped empty list (`[]`) is truthy, so count the rendered children.
  const isEmpty = !loading && Children.toArray(children).length === 0;

  return (
    <div data-slot="timeline" className={cn('flex flex-col gap-4', className)}>
      <Conditional>
        <Conditional.If condition={loading}>
          <div aria-busy="true" className="flex flex-col gap-4">
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex gap-3">
                <Skeleton shape="circle" size="sm" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="w-1/2" />
                  <Skeleton size="sm" className="w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </Conditional.If>
        <Conditional.If condition={isEmpty}>
          {empty ?? <EmptyState size="sm" kind="first-use" title={t('timeline.empty')} />}
        </Conditional.If>
        <Conditional.Else>
          <ol className="flex flex-col" {...props}>
            {children}
          </ol>
        </Conditional.Else>
      </Conditional>

      <Conditional.If condition={hasMore && !loading}>
        <Button variant="outline" size="sm" className="self-center" loading={loadingMore} onClick={onLoadMore}>
          {t('timeline.loadMore')}
        </Button>
      </Conditional.If>
    </div>
  );
};

Timeline.Item = Item;
Timeline.Group = Group;

export default Timeline;
