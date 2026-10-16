import type { ReactNode } from 'react';

import { useAppTranslation } from '@hooks/shared';

const Panel = ({ label, dot, caption, children }: { label: string; dot: string; caption?: ReactNode; children: ReactNode }) => (
  <figure data-slot="docs-dodont-panel" className="border-border m-0 overflow-hidden rounded-lg border">
    <div className="bg-surface-sunken flex min-h-28 items-center justify-center p-6">{children}</div>
    <figcaption className="border-border-subtle flex items-center gap-2 border-t px-3 py-2 text-sm">
      <span aria-hidden="true" className={`size-1.5 rounded-full ${dot}`} />
      <span className="text-fg font-medium">{label}</span>
      <span className="text-fg-muted">{caption}</span>
    </figcaption>
  </figure>
);

export function DoDont({
  do: good,
  dont: bad,
  doCaption,
  dontCaption,
}: {
  do: ReactNode;
  dont: ReactNode;
  doCaption?: ReactNode;
  dontCaption?: ReactNode;
}) {
  const { t } = useAppTranslation('docs');

  return (
    <div data-slot="docs-dodont" className="not-prose my-6 grid gap-3 sm:grid-cols-2">
      <Panel label={t('do')} dot="bg-success" caption={doCaption}>
        {good}
      </Panel>
      <Panel label={t('dont')} dot="bg-danger" caption={dontCaption}>
        {bad}
      </Panel>
    </div>
  );
}
