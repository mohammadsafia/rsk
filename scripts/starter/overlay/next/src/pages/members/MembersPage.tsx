'use client';

import { lazy, Suspense, useMemo, useState } from 'react';

import { Badge, Button } from '@components/ui';
import { PageHeader } from '@components/shared';
import { DataTable } from '@components/tables';
import { Conditional } from '@components/utils';

import { useAppTranslation, useDataTableQuery } from '@hooks/shared';
import { useDataTable } from '@hooks/utils';

import { type Member, MEMBERS_PAGE_SIZE, MEMBERS_QUERY_KEY, membersApi } from '@api/handlers/members';

import type { InviteMember } from './inviteSchema';

import { UserPlus } from 'lucide-react';

// The form (react-hook-form, Zod, the select) loads the first time someone opens it, not with the table.
const InviteMemberForm = lazy(() => import('./InviteMemberForm'));

type MembersPageProps = {
  /** The invite server action, from the route. */
  invite: InviteMember;
};

/**
 * The members example: a kit table over /api/members, its first page sent by the server, and an invite form that
 * submits through a server action (both in app/[lang]/(app)/members).
 */
function MembersPage({ invite }: MembersPageProps) {
  const { t, i18n } = useAppTranslation('members');
  const [inviting, setInviting] = useState(false);
  const [invitedOnce, setInvitedOnce] = useState(false);
  const { data, tableUtils, isFetching } = useDataTableQuery<Member>({
    queryKey: MEMBERS_QUERY_KEY,
    queryFn: membersApi.list,
    defaultPageSize: MEMBERS_PAGE_SIZE,
  });

  // UTC and Latin digits: the server and the browser write the same date, so hydration matches.
  const joined = useMemo(
    () => new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-u-nu-latn' : 'en', { dateStyle: 'medium', timeZone: 'UTC' }),
    [i18n.language],
  );

  const columns = useMemo(
    () => [
      { accessorKey: 'name', header: t('columns.name'), meta: { label: t('columns.name') } },
      { accessorKey: 'email', header: t('columns.email'), meta: { label: t('columns.email') } },
      {
        accessorKey: 'role',
        header: t('columns.role'),
        meta: { label: t('columns.role') },
        cell: ({ getValue }: { getValue: () => unknown }) => (
          <Badge tone={getValue() === 'admin' ? 'info' : 'neutral'}>{t(`roles.${String(getValue())}`)}</Badge>
        ),
      },
      {
        accessorKey: 'joinedAt',
        header: t('columns.joined'),
        meta: { label: t('columns.joined') },
        cell: ({ getValue }: { getValue: () => unknown }) => joined.format(new Date(String(getValue()))),
      },
    ],
    [t, joined],
  );

  const { table } = useDataTable<Member>({
    data,
    columns,
    rowCount: tableUtils.totalCount,
    pageCount: tableUtils.totalPages,
    state: tableUtils.state,
    onGlobalFilterChange: tableUtils.setGlobalFilter,
    onPaginationChange: tableUtils.setPagination,
    initialState: { pagination: { pageIndex: 0, pageSize: MEMBERS_PAGE_SIZE } },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('title')} description={t('description')}>
        <PageHeader.Actions>
          <Button
            onClick={() => {
              setInvitedOnce(true);
              setInviting(true);
            }}
          >
            <UserPlus aria-hidden="true" />
            {t('invite.button')}
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      <DataTable table={table} isLoading={isFetching && !data.length}>
        <DataTable.Toolbar totalCount={tableUtils.totalCount} totalLabel={t('total')} placeholder={t('search')} />
        <DataTable.Content />
        <DataTable.Pagination pageSizeOptions={[MEMBERS_PAGE_SIZE]} />
      </DataTable>

      <Conditional.If condition={invitedOnce}>
        <Suspense fallback={null}>
          <InviteMemberForm open={inviting} onOpenChange={setInviting} invite={invite} />
        </Suspense>
      </Conditional.If>
    </div>
  );
}

export default MembersPage;
