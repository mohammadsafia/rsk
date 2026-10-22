// @vitest-environment happy-dom
import { act } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
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

  it('never reveals on a server-rendered page’s hydration (the page stays still as it was sent), and records the visit', async () => {
    function Probe() {
      return <p>{useRevealOnce('/patients') ? 'reveal' : 'still'}</p>;
    }
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Probe />);
    document.body.append(container);
    await act(async () => void hydrateRoot(container, <Probe />));
    expect(container.textContent).toBe('still');
    expect(sessionStorage.getItem('rsk:revealed:/patients')).not.toBeNull();
    container.remove();
  });
});
