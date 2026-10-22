'use client';

import { type FC, type ReactNode, useEffect, useRef } from 'react';

import { RollingText, Skeleton } from '@components/ui';
import { Conditional } from '@components/utils';

import { KitLink, useMotion } from '@contexts';
import { useAppTranslation } from '@hooks/shared';
import { MOTION_DURATIONS, MOTION_EASINGS } from '@constants';

import { cn, formatNumber } from '@utils';

import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

export type StatCardTrend = {
  /** Percentage change, e.g. 12.4 or -3. */
  value: number;
  /** Override the direction derived from the sign. */
  direction?: 'up' | 'down';
  /** Which direction is good news. @default 'up' */
  positive?: 'up' | 'down';
};

export type StatCardProps = {
  label: ReactNode;
  value: ReactNode;
  trend?: StatCardTrend;
  /** e.g. "vs last week"; joins the trend's accessible label. */
  caption?: string;
  sparkline?: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
  /** Makes the whole card a link. */
  href?: string;
  className?: string;
};

const CARD = 'bg-surface border-border text-fg relative flex flex-col gap-2 rounded-lg border p-4';

const StatCard: FC<StatCardProps> = ({ label, value, trend, caption, sparkline, icon, loading = false, href, className }) => {
  const { t, i18n } = useAppTranslation('common');

  const direction = trend ? (trend.direction ?? (trend.value > 0 ? 'up' : trend.value < 0 ? 'down' : 'flat')) : 'flat';
  const good = direction !== 'flat' && direction === (trend?.positive ?? 'up');
  const percent = trend ? formatNumber(Math.abs(trend.value) / 100, i18n.language, { style: 'percent', maximumFractionDigits: 1 }) : '';
  const { mode } = useMotion();
  const figure = typeof value === 'string' || typeof value === 'number' ? String(value) : null;
  const trendRef = useRef<HTMLSpanElement>(null);
  const trendKey = `${percent}|${direction}`;
  // The trend last shown. Comparing against it (not a "first run" flag) keeps StrictMode's replayed mount effect still.
  const shownTrend = useRef(trendKey);
  // The trend pops in after its figure changes (spec §4) — never on first paint, never under reduced motion.
  useEffect(() => {
    if (shownTrend.current === trendKey) return;
    shownTrend.current = trendKey;
    if (mode === 'reduced') return;
    trendRef.current?.animate?.(
      [
        { transform: 'scale(0.9)', opacity: 0.6 },
        { transform: 'scale(1)', opacity: 1 },
      ],
      {
        duration: MOTION_DURATIONS.spring,
        easing: MOTION_EASINGS.spring,
      },
    );
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- pop only when the trend itself changes
  }, [trendKey]);

  const trendLabel = trend
    ? t(caption ? 'statCard.trendWithCaption' : 'statCard.trend', { direction: t(`statCard.${direction}`), value: percent, caption })
    : '';
  const TrendIcon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus;

  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-fg-muted text-sm">{label}</span>
        <Conditional.If condition={!!icon}>
          <span aria-hidden="true" className="text-fg-subtle [&_svg]:size-4">
            {icon}
          </span>
        </Conditional.If>
      </div>

      <Conditional>
        <Conditional.If condition={loading}>
          <Skeleton size="lg" className="w-24" />
        </Conditional.If>
        <Conditional.Else>
          <span dir="ltr" className="text-fg text-start font-mono text-2xl font-medium tabular-nums rtl:text-end">
            <Conditional>
              {/* Figures roll to their new value (spec §4); custom nodes render as given. */}
              <Conditional.If condition={figure !== null}>
                <RollingText text={figure ?? ''} />
              </Conditional.If>
              <Conditional.Else>{value}</Conditional.Else>
            </Conditional>
          </span>
        </Conditional.Else>
      </Conditional>

      <div className="flex items-end justify-between gap-3">
        <Conditional.If condition={!!trend && !loading}>
          <span
            ref={trendRef}
            data-slot="stat-card-trend"
            className={cn(
              'inline-flex items-center gap-1 text-xs font-medium',
              direction === 'flat' ? 'text-fg-muted' : good ? 'text-success' : 'text-danger',
            )}
          >
            {/* Real text: an aria-label on a generic span is ignored by many screen readers. */}
            <span className="sr-only">{trendLabel}</span>
            <TrendIcon aria-hidden="true" className="size-3.5 rtl:-scale-x-100" />
            <span aria-hidden="true" dir="ltr" className="tabular-nums">
              {percent}
            </span>
            <Conditional.If condition={!!caption}>
              <span aria-hidden="true" className="text-fg-muted font-normal">
                {caption}
              </span>
            </Conditional.If>
          </span>
        </Conditional.If>

        <Conditional.If condition={!!sparkline && !loading}>
          <span className="ms-auto w-24">{sparkline}</span>
        </Conditional.If>
      </div>
    </>
  );

  return (
    <Conditional>
      <Conditional.If condition={!!href}>
        <KitLink
          href={href ?? ''}
          data-slot="stat-card"
          className={cn(CARD, 'hover:border-border-strong focus-ring transition-colors', className)}
        >
          {body}
        </KitLink>
      </Conditional.If>
      <Conditional.Else>
        <article data-slot="stat-card" aria-busy={loading || undefined} className={cn(CARD, className)}>
          {body}
        </article>
      </Conditional.Else>
    </Conditional>
  );
};

export default StatCard;
