// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Tooltip } from '@components/ui';

import { FieldFamilyDemo } from './components.data.demos';

import '../../i18n';

afterEach(cleanup);

describe('FieldFamilyDemo', () => {
  it('renders all six field kinds at the Input height', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <Tooltip.Provider>
          <FieldFamilyDemo />
        </Tooltip.Provider>
      </QueryClientProvider>,
    );
    const fields = [
      '[data-slot="input"]',
      '[data-slot="select-trigger"]',
      '[data-slot="time-picker-trigger"]',
      '[data-slot="formatted-number-input"]',
      '[data-slot="date-picker-container"]',
      '[data-slot="combobox-trigger"]',
    ].map((selector) => document.querySelector(selector));

    expect(fields.every(Boolean)).toBe(true);
    for (const field of fields) expect(field!.className).toContain('h-control-md');
  });
});
