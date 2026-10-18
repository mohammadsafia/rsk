import type { ReactNode } from 'react';

import { Badge, Table } from '@components/ui';
import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

export type PropsTableRow = { prop: string; type: string; default?: string; description: ReactNode; required?: boolean };

export function PropsTable({ rows }: { rows: PropsTableRow[] }) {
  const { t } = useAppTranslation('docs');

  return (
    <div data-slot="docs-props" tabIndex={0} className="focus-ring not-prose border-border my-6 overflow-x-auto rounded-lg border">
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.Head>{t('props.prop')}</Table.Head>
            <Table.Head>{t('props.type')}</Table.Head>
            <Table.Head>{t('props.default')}</Table.Head>
            <Table.Head>{t('props.description')}</Table.Head>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {rows.map((row) => (
            <Table.Row key={row.prop}>
              <Table.Cell className="align-top whitespace-nowrap">
                <code dir="ltr" className="text-fg font-mono text-xs">
                  {row.prop}
                </code>
                <Conditional.If condition={!!row.required}>
                  <Badge variant="soft" tone="accent" className="ms-2">
                    {t('props.required')}
                  </Badge>
                </Conditional.If>
              </Table.Cell>
              <Table.Cell className="align-top">
                <code dir="ltr" className="text-fg-muted font-mono text-xs">
                  {row.type}
                </code>
              </Table.Cell>
              <Table.Cell className="align-top">
                <code dir="ltr" className="text-fg-muted font-mono text-xs">
                  {row.default ?? '—'}
                </code>
              </Table.Cell>
              <Table.Cell className="text-fg-muted align-top text-sm whitespace-normal">{row.description}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
}
