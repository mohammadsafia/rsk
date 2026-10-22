'use client';

import { type ComponentPropsWithoutRef, type FC } from 'react';

import { cn } from '@utils';

export type CardGridColumns = 1 | 2 | 3 | 4 | 5 | 6;
type Breakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl';

export type CardGridProps = ComponentPropsWithoutRef<'div'> & {
  columns?: CardGridColumns | Partial<Record<Breakpoint, CardGridColumns>>;
  gap?: 'sm' | 'md' | 'lg';
};

const COLUMNS: Record<Breakpoint, Record<CardGridColumns, string>> = {
  base: { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4', 5: 'grid-cols-5', 6: 'grid-cols-6' },
  sm: { 1: 'sm:grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-4', 5: 'sm:grid-cols-5', 6: 'sm:grid-cols-6' },
  md: { 1: 'md:grid-cols-1', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4', 5: 'md:grid-cols-5', 6: 'md:grid-cols-6' },
  lg: { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5', 6: 'lg:grid-cols-6' },
  xl: { 1: 'xl:grid-cols-1', 2: 'xl:grid-cols-2', 3: 'xl:grid-cols-3', 4: 'xl:grid-cols-4', 5: 'xl:grid-cols-5', 6: 'xl:grid-cols-6' },
};

const GAP = { sm: 'gap-2', md: 'gap-4', lg: 'gap-6' } as const;

const BREAKPOINTS: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl'];

const columnClasses = (columns: NonNullable<CardGridProps['columns']>) =>
  typeof columns === 'number' ? COLUMNS.base[columns] : BREAKPOINTS.flatMap((bp) => (columns[bp] ? [COLUMNS[bp][columns[bp]]] : []));

const CardGrid: FC<CardGridProps> = ({ className, columns = { base: 1, sm: 2, lg: 4 }, gap = 'md', ...props }) => (
  <div data-slot="card-grid" className={cn('grid', columnClasses(columns), GAP[gap], className)} {...props} />
);

CardGrid.displayName = 'CardGrid';

export default CardGrid;
