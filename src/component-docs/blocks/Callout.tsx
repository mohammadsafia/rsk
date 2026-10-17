import type { ReactNode } from 'react';

import { Alert } from '@components/ui';
import { Conditional } from '@components/utils';

const TONE = { note: 'info', warning: 'warning', danger: 'danger' } as const;

export function Callout({ tone = 'note', title, children }: { tone?: keyof typeof TONE; title?: ReactNode; children: ReactNode }) {
  return (
    <Alert tone={TONE[tone]} className="not-prose my-6">
      <Conditional.If condition={!!title}>
        <Alert.Title>{title}</Alert.Title>
      </Conditional.If>
      <Alert.Description>{children}</Alert.Description>
    </Alert>
  );
}
