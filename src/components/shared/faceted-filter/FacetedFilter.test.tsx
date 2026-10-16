// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { FacetedFilter } from '@components/shared';
import { FormHarness } from '../../../test-utils/FormHarness';

import i18n from '../../../i18n';

afterEach(async () => {
  cleanup();
  await act(() => i18n.changeLanguage('en'));
});

const options = [
  { label: 'Booked', value: 'booked' },
  { label: 'Arrived', value: 'arrived' },
  { label: 'Completed', value: 'completed' },
];

describe('FacetedFilter', () => {
  it('summarises three or more selections with the plural count', async () => {
    await act(() => i18n.changeLanguage('ar'));
    render(
      <FormHarness defaultValues={{ status: ['booked', 'arrived', 'completed'] }}>
        <FacetedFilter name="status" title="الحالة" filterVariant="multi-select" filterOptions={options} />
      </FormHarness>,
    );
    expect(screen.getByText('3 عناصر محددة')).toBeTruthy();
  });

  it('uses the field height for the text variant, not pixel values', () => {
    render(
      <FormHarness defaultValues={{ q: '' }}>
        <FacetedFilter name="q" />
      </FormHarness>,
    );
    const input = screen.getByRole('textbox');
    expect(input.getAttribute('placeholder')).toBe('Search');
    expect(input.outerHTML).not.toMatch(/\[\d+px\]/);
  });
});
