import { type ReactElement } from 'react';

import { useAppTranslation } from '@hooks/shared';

import SystemPage, { type SystemPageProps } from './SystemPage';

/** 403, inside the app shell: the visitor is signed in but may not open this page. */
function NoAccessPage({ layout }: Pick<SystemPageProps, 'layout'>): ReactElement {
  const { t } = useAppTranslation('block-system-pages');

  return <SystemPage code="403" layout={layout ?? 'app'} title={t('noAccess.title')} description={t('noAccess.description')} />;
}

export default NoAccessPage;
