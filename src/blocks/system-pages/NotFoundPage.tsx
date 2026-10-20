import { type ReactElement } from 'react';

import { useAppTranslation } from '@hooks/shared';

import SystemPage, { type SystemPageProps } from './SystemPage';

/** 404: the catch-all route, for an address that matches no page. */
function NotFoundPage({ layout }: Pick<SystemPageProps, 'layout'>): ReactElement {
  const { t } = useAppTranslation('block-system-pages');

  return <SystemPage layout={layout} code="404" title={t('notFound.title')} description={t('notFound.description')} />;
}

export default NotFoundPage;
