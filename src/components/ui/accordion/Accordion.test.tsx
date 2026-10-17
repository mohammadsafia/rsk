// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Accordion } from '@components/ui';

afterEach(cleanup);

describe('Accordion', () => {
  it('uses 44px triggers and hairline-separated items, and toggles', () => {
    render(
      <Accordion type="single" collapsible>
        <Accordion.Item value="a" data-testid="item">
          <Accordion.Trigger>Allergies</Accordion.Trigger>
          <Accordion.Content>Penicillin</Accordion.Content>
        </Accordion.Item>
      </Accordion>,
    );
    const trigger = screen.getByRole('button', { name: 'Allergies' });
    expect(trigger.className).toContain('min-h-11');
    expect(screen.getByTestId('item').className).toContain('border-border-subtle');
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });
});
