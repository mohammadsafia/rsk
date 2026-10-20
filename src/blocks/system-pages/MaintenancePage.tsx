import { type ReactElement } from 'react';

import { useAppTranslation } from '@hooks/shared';

import { Wrench } from 'lucide-react';

import SystemPage, { type SystemPageProps } from './SystemPage';

/** Shown while the app is down for maintenance: route visitors here from your API's 503, or a feature flag. */
function MaintenancePage({ layout }: Pick<SystemPageProps, 'layout'>): ReactElement {
  const { t } = useAppTranslation('block-system-pages');

  return (
    <SystemPage
      icon={<Wrench aria-hidden="true" strokeWidth={1.5} />}
      title={t('maintenance.title')}
      description={t('maintenance.description')}
    />
  );
}

export default MaintenancePage;
