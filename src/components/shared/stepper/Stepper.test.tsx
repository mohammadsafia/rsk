// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Stepper } from '@components/shared';

afterEach(cleanup);

describe('Stepper', () => {
  it('thickens the rule after a done step, easing at base', () => {
    render(
      <Stepper>
        <Stepper.Step status="done">One</Stepper.Step>
        <Stepper.Step status="current">Two</Stepper.Step>
        <Stepper.Step status="next">Three</Stepper.Step>
      </Stepper>,
    );
    const rules = Array.from(document.querySelectorAll<HTMLElement>('[data-slot="stepper-connector"] [data-slot="divider"]'));
    expect(rules).toHaveLength(2);
    expect(rules[0].className).toContain('h-(--rule-width-section)');
    expect(rules[1].className).not.toContain('h-(--rule-width-section)');
    expect(rules[0].className).toContain('duration-base');
  });

  it('reads a step as done from its icon too, when the step itself carries no status', () => {
    render(
      <Stepper>
        <Stepper.Step>
          <Stepper.Icon status="done" />
          <Stepper.Label>One</Stepper.Label>
        </Stepper.Step>
        <Stepper.Step>
          <Stepper.Icon status="current" />
        </Stepper.Step>
      </Stepper>,
    );
    const [rule] = Array.from(document.querySelectorAll<HTMLElement>('[data-slot="stepper-connector"] [data-slot="divider"]'));
    expect(rule.className).toContain('h-(--rule-width-section)');
  });
});
