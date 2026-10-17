// @vitest-environment happy-dom
import { MemoryRouter, Link } from 'react-router-dom';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { Button } from '@components/ui';

afterEach(cleanup);

describe('Button', () => {
  it('disabled asChild leaves the tab order and swallows activation', () => {
    const handleClick = vi.fn();
    render(
      <Button asChild disabled onClick={handleClick}>
        <a href="/members">Members</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Members' });
    expect(link.getAttribute('tabindex')).toBe('-1');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(handleClick).not.toHaveBeenCalled();
  });

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

  it('loading preserves width: label hidden in place, spinner overlaid', () => {
    render(<Button loading>Save</Button>);
    const button = screen.getByRole('button', { name: /Save/ });
    const label = button.querySelector('[data-slot="button-label"]');
    expect(label?.textContent).toBe('Save');
    expect(label?.className).toMatch(/\binvisible\b/);
    expect(button.querySelector('[data-slot="button-spinner"]')?.getAttribute('class')).toMatch(/\babsolute\b/);
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
