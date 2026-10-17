// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { FormSection } from '@components/forms';

afterEach(cleanup);

describe('FormSection', () => {
  it('titles a group of fields and separates sections with a hairline', () => {
    render(
      <>
        <FormSection title="Patient" description="Who the visit is for">
          <input aria-label="Name" />
        </FormSection>
        <FormSection title="Insurance">
          <input aria-label="Policy" />
        </FormSection>
      </>,
    );
    expect(screen.getByRole('heading', { name: 'Patient' })).toBeTruthy();
    expect(screen.getByText('Who the visit is for').className).toContain('text-fg-muted');
    const sections = document.querySelectorAll('[data-slot="form-section"]');
    expect(sections).toHaveLength(2);
    expect(sections[1].className).toContain('[&+&]:border-t');
  });
});
