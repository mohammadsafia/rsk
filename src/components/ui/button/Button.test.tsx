// @vitest-environment happy-dom
import { MemoryRouter, Link } from 'react-router-dom';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Button } from '@components/ui';

afterEach(cleanup);

describe('Button', () => {
  it('defaults to solid / neutral / md', () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.dataset.variant).toBe('solid');
    expect(button.dataset.tone).toBe('neutral');
    expect(button.className).toContain('h-control-md');
  });

  it('exposes variant and tone', () => {
    render(
      <Button variant="ghost" tone="danger">
        Remove
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Remove' });
    expect([button.dataset.variant, button.dataset.tone]).toEqual(['ghost', 'danger']);
  });

  it('loading keeps the label, sets aria-busy and blocks resubmits', () => {
    render(
      <Button type="submit" loading>
        Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: /Save/ });
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(button.querySelector('[data-slot="button-spinner"]')).not.toBeNull();
  });

  it('asChild renders the child element with button styling', () => {
    render(
      <MemoryRouter>
        <Button asChild variant="outline">
          <Link to="/patients">Patients</Link>
        </Button>
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: 'Patients' });
    expect(link.getAttribute('href')).toBe('/patients');
    expect(link.dataset.slot).toBe('button');
    expect(link.dataset.variant).toBe('outline');
  });
});
