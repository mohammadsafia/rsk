// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Card } from '@components/ui';

afterEach(cleanup);

describe('Card', () => {
  it('places Actions in the header trailing slot', () => {
    render(
      <Card>
        <Card.Header>
          <Card.Title>Patients</Card.Title>
          <Card.Description>Seen this week</Card.Description>
          <Card.Actions>
            <button type="button">Export</button>
          </Card.Actions>
        </Card.Header>
      </Card>,
    );
    const actions = screen.getByRole('button', { name: 'Export' }).parentElement!;
    expect(actions.dataset.slot).toBe('card-actions');
    expect(actions.closest('[data-slot="card-header"]')).not.toBeNull();
  });

  it('rests flat on the surface with a hairline border and no shadow', () => {
    render(<Card data-testid="card" />);
    const card = screen.getByTestId('card');
    expect(card.className).toContain('bg-surface');
    expect(card.className).toContain('border-border');
    expect(card.className).not.toMatch(/\bshadow/);
  });
});
