// @vitest-environment happy-dom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { FormFileUploader } from '@components/forms';

import { FormHarness } from '../../../test-utils/FormHarness';

import '../../../i18n';

afterEach(cleanup);

describe('FormFileUploader', () => {
  it('labels the file input and describes it with the inline error', async () => {
    render(
      <FormHarness defaultValues={{ report: null }} errors={{ report: 'Attach the report' }}>
        <FormFileUploader name="report" label="Report" />
      </FormHarness>,
    );
    const input = screen.getByLabelText('Report', { selector: 'input' });
    await waitFor(() => expect(input.getAttribute('aria-invalid')).toBe('true'));
    expect(document.getElementById(input.getAttribute('aria-describedby') ?? '')?.textContent).toBe('Attach the report');
  });
});
