'use client';

import { type ReactElement } from 'react';

import { useBlockTranslation } from '@hooks/shared';

import { LOCALE } from './locale';
import SystemPage, { type SystemPageProps } from './SystemPage';

/** 404: the catch-all route, for an address that matches no page. */
function NotFoundPage({ layout }: Pick<SystemPageProps, 'layout'>): ReactElement {
  const { t } = useBlockTranslation('block-system-pages', LOCALE);

  return <SystemPage layout={layout} code="404" title={t('notFound.title')} description={t('notFound.description')} />;
}

export default NotFoundPage;
