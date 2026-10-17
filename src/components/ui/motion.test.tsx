// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Accordion, Card, Collapsible } from '@components/ui';

afterEach(cleanup);

describe('reduced motion', () => {
  it('stops the accordion and collapsible height animations', () => {
    render(
      <>
        <Accordion type="single" defaultValue="a">
          <Accordion.Item value="a">
            <Accordion.Trigger>Visit notes</Accordion.Trigger>
            <Accordion.Content>Body</Accordion.Content>
          </Accordion.Item>
        </Accordion>
        <Collapsible defaultOpen>
          <Collapsible.Trigger>More</Collapsible.Trigger>
          <Collapsible.Content>Hidden</Collapsible.Content>
        </Collapsible>
      </>,
    );
    expect(document.querySelector('[data-slot="accordion-content"]')?.className).toContain('motion-reduce:animate-none');
    expect(document.querySelector('[data-slot="collapsible-content"]')?.className).toContain('motion-reduce:animate-none');
  });
});

describe('disclosure timing', () => {
  it('opens at base and closes at fast (tw-animate would otherwise default to 200ms)', () => {
    render(
      <>
        <Accordion type="single" defaultValue="a">
          <Accordion.Item value="a">
            <Accordion.Trigger>Visit notes</Accordion.Trigger>
            <Accordion.Content>Body</Accordion.Content>
          </Accordion.Item>
        </Accordion>
        <Collapsible defaultOpen>
          <Collapsible.Trigger>More</Collapsible.Trigger>
          <Collapsible.Content>Hidden</Collapsible.Content>
        </Collapsible>
      </>,
    );
    for (const slot of ['accordion-content', 'collapsible-content']) {
      const className = document.querySelector(`[data-slot="${slot}"]`)?.className ?? '';
      expect(className, slot).toContain('data-[state=open]:duration-base');
      expect(className, slot).toContain('data-[state=closed]:duration-fast');
    }
  });

  it('times the collapsible Card the same way', () => {
    render(
      <Card title="Visit notes" collapsible defaultOpen>
        Body
      </Card>,
    );
    const content = screen.getByText('Body').closest('[data-state]') as HTMLElement;
    expect(content.className).toContain('data-[state=open]:duration-base');
    expect(content.className).toContain('data-[state=closed]:duration-fast');
  });
});
