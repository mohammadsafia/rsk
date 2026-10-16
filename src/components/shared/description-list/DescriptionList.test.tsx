// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { DescriptionList } from '@components/shared';

afterEach(cleanup);

describe('DescriptionList', () => {
  it('renders terms and values from items, isolating numeric values LTR', () => {
    render(
      <DescriptionList
        items={[
          { term: 'Doctor', value: 'Dr. Lina Khoury' },
          { term: 'File number', value: 'MRN-20391', numeric: true },
          { term: 'Insurance', value: null },
        ]}
      />,
    );
    expect(screen.getByText('Doctor').tagName).toBe('DT');
    expect(screen.getByText('Dr. Lina Khoury').closest('dd')).not.toBeNull();
    const id = screen.getByText('MRN-20391');
    expect(id.getAttribute('dir')).toBe('ltr');
    expect(id.className).toContain('tabular-nums');
    expect(screen.getByText('—')).toBeTruthy();
  });

  it('sets the grid from columns and the row layout from layout', () => {
    render(
      <DescriptionList columns={3} layout="inline">
        <DescriptionList.Item term="Status" value="Confirmed" />
      </DescriptionList>,
    );
    const list = document.querySelector('[data-slot="description-list"]') as HTMLElement;
    expect(list.className).toContain('lg:grid-cols-3');
    expect((document.querySelector('[data-slot="description-list-item"]') as HTMLElement).getAttribute('data-layout')).toBe('inline');
  });
});
