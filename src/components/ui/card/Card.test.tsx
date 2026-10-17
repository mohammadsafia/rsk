// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Card, Sections, Tooltip } from '@components/ui';

import '../../../i18n';

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

describe('Card shortcuts and states', () => {
  it('builds the header from title, description, icon and tooltip', () => {
    render(
      <Tooltip.Provider>
        <Card title="Patients" description="Seen this week" icon={<svg data-testid="icon" />} tooltip="Counts unique visits">
          <Card.Content>Body</Card.Content>
        </Card>
      </Tooltip.Provider>,
    );
    expect(screen.getByRole('heading', { name: 'Patients' })).toBeTruthy();
    expect(screen.getByText('Seen this week')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'More information' })).toBeTruthy();
    expect(screen.getByTestId('icon').closest('[data-slot="card-header"]')).not.toBeNull();
  });

  it('collapses and removes its body from the tab order', () => {
    render(
      <Tooltip.Provider>
        <Card title="Billable lines" collapsible>
          <Card.Content>
            <button type="button">Add row</button>
          </Card.Content>
        </Card>
      </Tooltip.Provider>,
    );
    const toggle = screen.getByRole('button', { name: 'Show or hide content' });
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('button', { name: 'Add row' })).toBeNull();
  });

  it('shows skeletons while loading', () => {
    render(
      <Card title="Patients" loading>
        <Card.Content>Real body</Card.Content>
      </Card>,
    );
    expect(screen.queryByText('Real body')).toBeNull();
    expect(document.querySelector('[data-slot="card-content"]')?.getAttribute('aria-busy')).toBe('true');
    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it('tints the whole card by tone', () => {
    render(<Card tone="success" data-testid="card" />);
    const card = screen.getByTestId('card');
    expect(card.dataset.tone).toBe('success');
    expect(card.className).toContain('bg-success-subtle');
  });
});

describe('Card collapsible header layout', () => {
  it('keeps Title and Description in the first column when there are no Actions', () => {
    render(
      <Tooltip.Provider>
        <Card collapsible>
          <Card.Header>
            <Card.Title>Billable lines</Card.Title>
            <Card.Description>Draft</Card.Description>
          </Card.Header>
          <Card.Content>Body</Card.Content>
        </Card>
      </Tooltip.Provider>,
    );
    expect(screen.getByRole('heading', { name: 'Billable lines' }).className).toContain('col-start-1');
    expect(screen.getByText('Draft').className).toContain('col-start-1');
  });

  it('tops a card that has a header with the heavy rule, with no marker outside Sections', () => {
    render(<Card title="Today's visits">Body</Card>);
    const card = document.querySelector<HTMLElement>('article')!;
    expect(card.className).toContain('has-data-[slot=card-header]:rule-top');
    expect(card.className).toContain('relative');
    expect(screen.getByRole('heading', { name: "Today's visits" }).querySelector('[data-slot="section-marker"]')).toBeNull();
  });

  it('numbers card titles inside Sections', () => {
    render(
      <Sections>
        <Card title="Visits">a</Card>
        <Card title="Revenue">b</Card>
      </Sections>,
    );
    const kinds = Array.from(document.querySelectorAll<HTMLElement>('[data-slot="section-marker"]')).map((marker) => marker.dataset.kind);
    expect(kinds).toEqual(['number', 'number']);
  });
});
