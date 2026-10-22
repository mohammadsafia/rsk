'use client';

import { useMemo, useState } from 'react';

import { type DateInput, useAppTranslation, useDate } from '@hooks/shared';

export type TimelineGroup<T> = { key: string; label: string; items: T[] };

/** Groups items by local calendar day, newest day first; items keep their order inside a day. */
export function useGroupedByDay<T>(items: T[], getTime: (item: T) => DateInput): TimelineGroup<T>[] {
  const { t } = useAppTranslation('common');
  const { toDate, subtractDuration, isValid, formatDate, constants } = useDate();

  // "Today" is read once when the list mounts, not on every render, so labels stay steady while it is shown.
  const [now] = useState(() => new Date());

  return useMemo(() => {
    const today = toDate(now, constants.DateFormats.ISO_DATE);
    const yesterday = toDate(subtractDuration(now, 1, constants.UnitOfTime.DAY), constants.DateFormats.ISO_DATE);
    const groups = new Map<string, T[]>();

    for (const item of items) {
      const time = getTime(item);
      const key = isValid(time) ? toDate(time, constants.DateFormats.ISO_DATE) : '';
      groups.set(key, [...(groups.get(key) ?? []), item]);
    }

    return [...groups.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, groupItems]) => ({
        key,
        label:
          key === today
            ? t('timeline.today')
            : key === yesterday
              ? t('timeline.yesterday')
              : key
                ? formatDate(key, constants.DateFormats.SHORT_MONTH_DAY_YEAR)
                : '—',
        items: groupItems,
      }));
  }, [items, getTime, t, now, toDate, subtractDuration, isValid, formatDate, constants]);
}
