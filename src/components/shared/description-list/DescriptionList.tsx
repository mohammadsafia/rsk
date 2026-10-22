'use client';

import { type ComponentPropsWithoutRef, createContext, type FC, type ReactNode, useContext } from 'react';

import { Conditional } from '@components/utils';

import { cn } from '@utils';

type Layout = 'stacked' | 'inline';

export type DescriptionListItem = {
  term: ReactNode;
  value?: ReactNode;
  /** IDs, amounts, times: rendered LTR in tabular mono. */
  numeric?: boolean;
};

export type DescriptionListItemProps = DescriptionListItem & { className?: string };

export type DescriptionListProps = Omit<ComponentPropsWithoutRef<'dl'>, 'children'> & {
  items?: DescriptionListItem[];
  columns?: 1 | 2 | 3;
  layout?: Layout;
  children?: ReactNode;
};

type DescriptionListComponent = FC<DescriptionListProps> & {
  Item: FC<DescriptionListItemProps>;
};

const COLUMNS: Record<1 | 2 | 3, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
};

const LayoutContext = createContext<Layout>('stacked');

const isEmpty = (value: ReactNode) => value === null || value === undefined || value === '';

const Item: FC<DescriptionListItemProps> = ({ term, value, numeric = false, className }) => {
  const layout = useContext(LayoutContext);

  return (
    <div
      data-slot="description-list-item"
      data-layout={layout}
      className={cn(layout === 'inline' ? 'flex items-baseline justify-between gap-4' : 'flex flex-col gap-0.5', className)}
    >
      <dt className="text-fg-muted flex items-center gap-1.5 text-sm [&_svg]:size-3.5">{term}</dt>

      <dd className={cn('text-fg text-sm font-medium', layout === 'inline' && 'text-end')}>
        <Conditional>
          <Conditional.If condition={isEmpty(value)}>
            <span className="text-fg-muted">—</span>
          </Conditional.If>

          <Conditional.If condition={numeric}>
            <span dir="ltr" className="font-mono tabular-nums">
              {value}
            </span>
          </Conditional.If>

          <Conditional.Else>{value}</Conditional.Else>
        </Conditional>
      </dd>
    </div>
  );
};

const DescriptionList: DescriptionListComponent = ({ className, items, columns = 1, layout = 'stacked', children, ...props }) => (
  <LayoutContext.Provider value={layout}>
    <dl data-slot="description-list" className={cn('grid gap-x-6 gap-y-3', COLUMNS[columns], className)} {...props}>
      {items?.map((item, index) => (
        <Item key={index} {...item} />
      ))}

      {children}
    </dl>
  </LayoutContext.Provider>
);

DescriptionList.Item = Item;
DescriptionList.displayName = 'DescriptionList';

export default DescriptionList;
