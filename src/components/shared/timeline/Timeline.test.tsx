// @vitest-environment happy-dom
import { cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { Tooltip } from '@components/ui';
import { Timeline, useGroupedByDay } from '@components/shared';

import '../../../i18n';

afterEach(cleanup);

const wrap = (ui: React.ReactNode) => render(<Tooltip.Provider>{ui}</Tooltip.Provider>);

describe('Timeline', () => {
  it('renders an ordered list of items with a machine-readable time', () => {
    wrap(
      <Timeline>
        <Timeline.Item title="Visit completed" meta="Dr. Haddad" time="2026-10-16T10:30:00" />
        <Timeline.Item title="Invoice paid" time="2026-10-15T09:00:00" tone="success" />
      </Timeline>,
    );
    const list = screen.getByRole('list');
    expect(list.tagName).toBe('OL');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(document.querySelector('time')?.getAttribute('dateTime')).toContain('2026-10-16');
  });

  it('renders items without a time (or with an invalid one) and no <time>', () => {
    wrap(
      <Timeline>
        <Timeline.Item title="Note added" />
        <Timeline.Item title="Imported" time="not a date" />
      </Timeline>,
    );
    expect(screen.getByText('Note added')).toBeTruthy();
    expect(screen.getByText('Imported')).toBeTruthy();
    expect(document.querySelector('time')).toBeNull();
  });

  it('shows the empty state, and a Load more button that calls back', () => {
    const onLoadMore = vi.fn();
    const { rerender } = wrap(<Timeline />);
    expect(screen.getByText('No activity yet')).toBeTruthy();

    rerender(
      <Tooltip.Provider>
        <Timeline hasMore onLoadMore={onLoadMore}>
          <Timeline.Item title="Visit completed" />
        </Timeline>
      </Tooltip.Provider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
    expect(onLoadMore).toHaveBeenCalledOnce();
  });

  it('shows the empty state for an empty mapped list', () => {
    const events: string[] = [];
    wrap(
      <Timeline>
        {events.map((event) => (
          <Timeline.Item key={event} title={event} />
        ))}
      </Timeline>,
    );
    expect(screen.getByText('No activity yet')).toBeTruthy();
  });

  it('groups items by local day, newest first, labelling today and yesterday', () => {
    const now = new Date();
    const earlier = new Date(now.getTime() - 60_000);
    const yesterday = new Date(now.getTime() - 24 * 3_600_000);
    const items = [{ at: yesterday }, { at: now }, { at: earlier }];

    const { result } = renderHook(() => useGroupedByDay(items, (item) => item.at));
    expect(result.current.map((group) => group.label)).toEqual(['Today', 'Yesterday']);
    expect(result.current[0].items).toEqual([items[1], items[2]]);
  });
});
