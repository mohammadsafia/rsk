// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import { useRevealOnce } from './useRevealOnce';

function Probe({ id }: { id: string }) {
  const reveal = useRevealOnce(id);
  return <div data-testid="probe" data-reveal={reveal || undefined} />;
}

const revealed = () => document.querySelector('[data-testid="probe"]')!.hasAttribute('data-reveal');

beforeEach(() => sessionStorage.clear());
afterEach(cleanup);

describe('useRevealOnce', () => {
  it('reveals on the first visit in a session, and not on a revisit (back/forward, navigating back)', () => {
    render(<Probe id="/billing" />);
    expect(revealed()).toBe(true);
    cleanup();
    render(<Probe id="/billing" />);
    expect(revealed()).toBe(false);
  });

  it('tracks each key separately', () => {
    render(<Probe id="/billing" />);
    cleanup();
    render(<Probe id="/patients" />);
    expect(revealed()).toBe(true);
  });
});
