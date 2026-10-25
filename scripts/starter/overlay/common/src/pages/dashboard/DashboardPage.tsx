'use client';

import { EmptyState } from '@components/ui';
import { PageHeader } from '@components/shared';

import { useAppTranslation } from '@hooks/shared';

import { LayoutDashboard } from 'lucide-react';

/** The first page of a new app. Replace it with your own; the kit lives in src/components. */
function DashboardPage() {
  const { t } = useAppTranslation('dashboard');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('title')} description={t('description')} />

      <EmptyState icon={<LayoutDashboard aria-hidden="true" />} title={t('empty.title')} description={t('empty.description')} />
    </div>
  );
}

export default DashboardPage;
