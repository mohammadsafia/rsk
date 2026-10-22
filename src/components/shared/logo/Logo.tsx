'use client';

import { type ComponentPropsWithoutRef, type FC } from 'react';

import { Conditional } from '@components/utils';

import { cn } from '@utils';

type LogoSize = 'sm' | 'md' | 'lg';

export type LogoProps = Omit<ComponentPropsWithoutRef<'span'>, 'children'> & {
  variant?: 'mark' | 'lockup';
  size?: LogoSize;
  /** Lockup only: adds "React Starter Kit" under the wordmark. */
  tagline?: boolean;
};

const MARK_SIZE: Record<LogoSize, string> = { sm: 'size-4', md: 'size-6', lg: 'size-8' };
const WORDMARK_SIZE: Record<LogoSize, string> = { sm: 'text-sm', md: 'text-md', lg: 'text-lg' };

/** 32-unit geometry; the 16px mark uses slightly larger squares so they survive rasterising. */
const GEOMETRY = {
  regular: { size: 8, near: 7, far: 17, rx: 2.5, accentRx: 4 },
  small: { size: 8.5, near: 6.5, far: 17, rx: 2.5, accentRx: 4.25 },
} as const;

const Mark: FC<{ size: LogoSize; labelled: boolean }> = ({ size, labelled }) => {
  const g = size === 'sm' ? GEOMETRY.small : GEOMETRY.regular;

  return (
    <svg
      viewBox="0 0 32 32"
      role={labelled ? 'img' : undefined}
      aria-label={labelled ? 'RSK' : undefined}
      aria-hidden={labelled ? undefined : true}
      className={cn('shrink-0 rtl:-scale-x-100', MARK_SIZE[size])}
    >
      <rect width="32" height="32" rx="8" className="fill-fg" />
      <rect x={g.near} y={g.near} width={g.size} height={g.size} rx={g.rx} className="fill-canvas" />
      <rect x={g.far} y={g.near} width={g.size} height={g.size} rx={g.rx} className="fill-canvas" />
      <rect x={g.near} y={g.far} width={g.size} height={g.size} rx={g.rx} className="fill-canvas" />
      <rect x={g.far} y={g.far} width={g.size} height={g.size} rx={g.accentRx} className="fill-accent" />
    </svg>
  );
};

const Logo: FC<LogoProps> = ({ variant = 'mark', size = 'md', tagline = false, className, ...props }) => (
  <span data-slot="logo" className={cn('inline-flex items-center gap-2', className)} {...props}>
    <Mark size={size} labelled={variant === 'mark'} />

    <Conditional.If condition={variant === 'lockup'}>
      <span className="flex flex-col leading-none">
        <span className={cn('text-fg font-semibold tracking-tight', WORDMARK_SIZE[size])}>RSK</span>

        <Conditional.If condition={tagline}>
          <span className="text-fg-muted text-2xs mt-1">React Starter Kit</span>
        </Conditional.If>
      </span>
    </Conditional.If>
  </span>
);

Logo.displayName = 'Logo';

export default Logo;
