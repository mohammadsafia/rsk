// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

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

  it('a removable tag names what it removes and calls onRemove once it has collapsed', async () => {
    const handleRemove = vi.fn();
    render(<Tag onRemove={handleRemove}>Penicillin</Tag>);
    const remove = screen.getByRole('button', { name: 'Remove Penicillin' });
    fireEvent.click(remove);
    await vi.waitFor(() => expect(handleRemove).toHaveBeenCalledTimes(1));
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

  describe('removing', () => {
    let reduced = false;
    beforeEach(() => {
      reduced = false;
      vi.useFakeTimers();
      window.matchMedia = ((query: string) => ({
        matches: reduced && query.includes('reduce'),
        addEventListener() {},
        removeEventListener() {},
      })) as unknown as typeof window.matchMedia;
      // happy-dom has no WAAPI: an animation that never finishes leaves the timeout fallback in charge.
      Element.prototype.animate = vi.fn(() => ({
        cancel() {},
        finished: new Promise(() => {}),
      })) as unknown as typeof Element.prototype.animate;
    });
    afterEach(() => vi.useRealTimers());

    it('collapses first, then calls onRemove exactly once even when double-clicked', () => {
      const onRemove = vi.fn();
      render(<Tag onRemove={onRemove}>Cardiology</Tag>);
      const button = screen.getByRole('button', { name: 'Remove Cardiology' });
      fireEvent.click(button);
      fireEvent.click(button);
      expect(onRemove).not.toHaveBeenCalled();
      expect(button.closest('[data-slot="tag"]')?.hasAttribute('data-leaving')).toBe(true);
      vi.advanceTimersByTime(400);
      expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it('keeps the folded state until the next frame, so a removal never flashes back before React commits it', () => {
      const cancel = vi.fn();
      Element.prototype.animate = vi.fn(() => ({ cancel, finished: new Promise(() => {}) })) as unknown as typeof Element.prototype.animate;
      const onRemove = vi.fn();
      render(<Tag onRemove={onRemove}>Cardiology</Tag>);
      fireEvent.click(screen.getByRole('button', { name: 'Remove Cardiology' }));
      vi.advanceTimersByTime(170); // the fallback: fast (120) + 50
      expect(onRemove).toHaveBeenCalledTimes(1);
      expect(cancel).not.toHaveBeenCalled();
      // The parent kept the tag (declined the removal): on the next frame it shows again.
      vi.advanceTimersByTime(32);
      expect(cancel).toHaveBeenCalledTimes(1);
    });

    it('calls onRemove at once under reduced motion', () => {
      reduced = true;
      const onRemove = vi.fn();
      render(<Tag onRemove={onRemove}>Cardiology</Tag>);
      fireEvent.click(screen.getByRole('button', { name: 'Remove Cardiology' }));
      expect(onRemove).toHaveBeenCalledTimes(1);
    });
    it('moves focus to the next tag when the focused one is removed, not to <body>', () => {
      const Tags = () => {
        const [items, setItems] = useState(['Cardiology', 'Dermatology', 'Oncology']);
        return (
          <div>
            {items.map((item) => (
              <Tag key={item} onRemove={() => setItems((current) => current.filter((other) => other !== item))}>
                {item}
              </Tag>
            ))}
          </div>
        );
      };
      render(<Tags />);
      const middle = screen.getByRole('button', { name: 'Remove Dermatology' });
      middle.focus();
      fireEvent.click(middle);
      act(() => {
        vi.advanceTimersByTime(200);
      });
      act(() => {
        vi.advanceTimersByTime(32);
      });
      expect(screen.queryByText('Dermatology')).toBeNull();
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remove Oncology' }));
    });

    it('moves focus to the previous tag when the last one is removed', () => {
      reduced = true;
      const Tags = () => {
        const [items, setItems] = useState(['Cardiology', 'Oncology']);
        return (
          <div>
            {items.map((item) => (
              <Tag key={item} onRemove={() => setItems((current) => current.filter((other) => other !== item))}>
                {item}
              </Tag>
            ))}
          </div>
        );
      };
      render(<Tags />);
      const last = screen.getByRole('button', { name: 'Remove Oncology' });
      last.focus();
      fireEvent.click(last);
      act(() => {
        vi.advanceTimersByTime(32);
      });
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remove Cardiology' }));
    });

    it("doesn't call onRemove when the tag unmounts mid-exit (its parent went away)", () => {
      const onRemove = vi.fn();
      const { unmount } = render(<Tag onRemove={onRemove}>Cardiology</Tag>);
      fireEvent.click(screen.getByRole('button', { name: 'Remove Cardiology' }));
      unmount();
      vi.advanceTimersByTime(400);
      expect(onRemove).not.toHaveBeenCalled();
    });
  });
});
