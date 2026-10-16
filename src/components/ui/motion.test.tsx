// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Accordion, Collapsible } from '@components/ui';

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
