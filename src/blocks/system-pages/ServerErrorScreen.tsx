'use client';

import { type ReactElement } from 'react';

import { Button } from '@components/ui';

import { useBlockTranslation } from '@hooks/shared';

import { RefreshCw } from 'lucide-react';

import { LOCALE } from './locale';
import SystemPage, { type SystemPageProps } from './SystemPage';

export type ServerErrorScreenProps = Pick<SystemPageProps, 'layout'> & {
  onRetry: () => void;
  /** Shows the retry button as busy. */
  retrying?: boolean;
};

/** The 500 page itself, without the error wiring: `ServerErrorPage` takes the router's error; use this one anywhere else. */
function ServerErrorScreen({ layout, onRetry, retrying = false }: ServerErrorScreenProps): ReactElement {
  const { t } = useBlockTranslation('block-system-pages', LOCALE);

  return (
    <SystemPage layout={layout} code="500" kind="error" title={t('serverError.title')} description={t('serverError.description')}>
      <Button loading={retrying} onClick={onRetry}>
        <RefreshCw aria-hidden="true" />
        {t('serverError.retry')}
      </Button>
    </SystemPage>
  );
}

export default ServerErrorScreen;
