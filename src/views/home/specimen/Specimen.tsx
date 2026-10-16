import { useEffect, useRef } from 'react';

import { Button, CalendarEvent, Card, Input, Table, Tag, Toast } from '@components/ui';

import { useAppTranslation } from '@hooks/shared';

import { AlertTriangle, Clock } from 'lucide-react';

const PANEL = 'bg-surface border-border min-w-0 rounded-lg border p-4';
const EYEBROW = 'text-fg-muted font-mono text-2xs font-medium tracking-wider uppercase rtl:font-sans rtl:tracking-normal';

function Specimen() {
  const { t } = useAppTranslation('home');
  const gridRef = useRef<HTMLDivElement>(null);

  // React 18 does not know the `inert` prop; set the attribute directly.
  useEffect(() => {
    gridRef.current?.setAttribute('inert', '');
  }, []);

  return (
    <section data-slot="landing-specimen" aria-label={t('specimen.label')} className="mx-auto max-w-6xl px-4 py-12 md:px-6">
      <p className="sr-only">{t('specimen.description')}</p>

      <div ref={gridRef} aria-hidden="true" data-slot="specimen-grid" className="grid gap-3 md:grid-cols-3">
        <div className={`${PANEL} md:row-span-2`}>
          <div className="mb-3 flex items-center justify-between">
            <span className={EYEBROW}>{t('specimen.calendar')}</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <CalendarEvent tone="info">
              <span dir="ltr" className="font-mono tabular-nums">
                09:00
              </span>{' '}
              · {t('specimen.events.checkup')}
            </CalendarEvent>

            <CalendarEvent tone="accent">
              <span dir="ltr" className="font-mono tabular-nums">
                10:30
              </span>{' '}
              · {t('specimen.events.consult')}
            </CalendarEvent>

            <div className="border-accent relative my-1.5 border-t">
              <span className="bg-accent absolute -start-1 -top-1 size-2 rounded-full" />
            </div>

            <CalendarEvent tone="success">
              <span dir="ltr" className="font-mono tabular-nums">
                13:00
              </span>{' '}
              · {t('specimen.events.lab')}
            </CalendarEvent>

            <CalendarEvent tone="warning">
              <span dir="ltr" className="font-mono tabular-nums">
                15:00
              </span>{' '}
              · {t('specimen.events.insurance')}
            </CalendarEvent>
          </div>
        </div>

        <div className={PANEL}>
          <span className={EYEBROW}>{t('specimen.fields')}</span>

          <div className="mt-3 flex flex-col gap-2">
            <div className="border-border-strong bg-surface text-fg-muted h-control-md flex items-center gap-2 rounded-md border px-3 text-sm">
              <Clock aria-hidden="true" className="size-4" />
              {t('specimen.selectTime')}
            </div>

            <Input size="md" defaultValue="layla@" aria-invalid="true" dir="ltr" readOnly />

            <p className="text-danger flex items-center gap-1 text-xs">
              <AlertTriangle aria-hidden="true" className="size-3.5" />
              {t('specimen.emailError')}
            </p>
          </div>
        </div>

        <div className={PANEL}>
          <span className={EYEBROW}>{t('specimen.status')}</span>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <Tag tone="success">{t('specimen.tags.active')}</Tag>
            <Tag tone="warning">{t('specimen.tags.pending')}</Tag>
            <Tag tone="accent">{t('specimen.tags.urgent')}</Tag>
            <Tag>{t('specimen.tags.cardiology')}</Tag>
          </div>
        </div>

        <div className={`${PANEL} md:col-span-2`}>
          <div className="flex items-center justify-between">
            <span className={EYEBROW}>{t('specimen.table')}</span>

            <span className="text-fg-subtle font-mono text-xs tabular-nums rtl:font-sans">{t('specimen.rows')}</span>
          </div>

          <Table className="mt-2">
            <Table.Header>
              <Table.Row>
                <Table.Head>{t('specimen.columns.invoice')}</Table.Head>
                <Table.Head>{t('specimen.columns.patient')}</Table.Head>
                <Table.Head numeric>{t('specimen.columns.amount')}</Table.Head>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              <Table.Row>
                <Table.Cell>
                  <span dir="ltr" className="font-mono tabular-nums">
                    INV-2026-0142
                  </span>
                </Table.Cell>
                <Table.Cell>Layla Haddad</Table.Cell>
                <Table.Cell numeric>1,240.50</Table.Cell>
              </Table.Row>

              <Table.Row data-state="selected">
                <Table.Cell>
                  <span dir="ltr" className="font-mono tabular-nums">
                    INV-2026-0143
                  </span>
                </Table.Cell>
                <Table.Cell>Omar Nasser</Table.Cell>
                <Table.Cell numeric>87.00</Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table>
        </div>

        <div className="md:col-span-1">
          <Toast.Provider>
            <Toast open tone="success" duration={Infinity}>
              <Toast.Icon tone="success" />
              <div className="grid gap-0.5">
                <Toast.Title>{t('specimen.toastTitle')}</Toast.Title>
                <Toast.Description>{t('specimen.toastBody')}</Toast.Description>
              </div>
            </Toast>

            <Toast.Viewport className="static inset-auto m-0 w-full max-w-none p-0" />
          </Toast.Provider>
        </div>

        <Card className="shadow-raised md:col-span-2">
          <Card.Content className="flex flex-col gap-1">
            <p className="text-fg text-sm font-semibold">{t('specimen.confirmTitle')}</p>

            <p className="text-fg-muted text-sm">{t('specimen.confirmBody')}</p>

            <div className="mt-3 flex justify-end gap-2">
              <Button size="sm" variant="outline">
                {t('specimen.cancel')}
              </Button>
              <Button size="sm" tone="danger">
                {t('specimen.delete')}
              </Button>
            </div>
          </Card.Content>
        </Card>
      </div>
    </section>
  );
}

export default Specimen;
