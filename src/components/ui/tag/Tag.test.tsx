// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { Tag } from '@components/ui';

// i18n has no path alias (it lives at the src root); load real English strings for accessible names.
import '../../../i18n';

afterEach(cleanup);

describe('Tag', () => {
  it('a removable tag with element children takes its remove name from label', () => {
    render(
      <Tag label="report.pdf" onRemove={() => undefined}>
        <span className="truncate">report.pdf</span>
      </Tag>,
    );
    expect(screen.getByRole('button', { name: 'Remove report.pdf' })).toBeTruthy();
  });

  it('a toggle tag forwards extra props to its button', () => {
    render(
      <Tag data-testid="toggle" title="Filter" onClick={() => undefined}>
        Cardiology
      </Tag>,
    );
    expect(screen.getByTestId('toggle').getAttribute('title')).toBe('Filter');
  });

  it('renders a static tag as a span', () => {
    render(<Tag>Asthma</Tag>);
    expect(screen.getByText('Asthma').tagName).toBe('SPAN');
  });

  it('a removable tag names what it removes and calls onRemove', () => {
    const handleRemove = vi.fn();
    render(<Tag onRemove={handleRemove}>Penicillin</Tag>);
    const remove = screen.getByRole('button', { name: 'Remove Penicillin' });
    fireEvent.click(remove);
    expect(handleRemove).toHaveBeenCalledTimes(1);
  });

  it('a toggle tag is a button exposing aria-pressed', () => {
    render(
      <Tag selected onClick={() => undefined}>
        Cardiology
      </Tag>,
    );
    expect(screen.getByRole('button', { name: 'Cardiology' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('marks a selected filter tag with ink, keeps aria-pressed and its box', () => {
    render(
      <Tag selected onClick={() => {}}>
        Insured
      </Tag>,
    );
    const tag = screen.getByRole('button', { name: 'Insured' });
    expect(tag.getAttribute('aria-pressed')).toBe('true');
    expect(tag.className).toContain('ink');
    expect(tag.className).toContain('border-fg');
    expect(tag.className).not.toContain('bg-accent-subtle');
  });
});
