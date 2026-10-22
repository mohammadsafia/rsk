// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { expect, it } from 'vite-plus/test';

import { useIsHydrated } from './useIsHydrated';

function Probe() {
  return <p>{useIsHydrated() ? 'client' : 'server'}</p>;
}

it('is true on the first render under createRoot (Vite: nothing changes)', async () => {
  const el = document.createElement('div');
  const root = createRoot(el);
  await act(async () => root.render(<Probe />));
  expect(el.textContent).toBe('client');
  root.unmount();
});

it('is false on the server and while hydrating, then true, with no mismatch', async () => {
  const html = renderToString(<Probe />);
  expect(html).toContain('server');
  const el = document.createElement('div');
  el.innerHTML = html;
  const errors: unknown[] = [];
  await act(async () => void hydrateRoot(el, <Probe />, { onRecoverableError: (error) => errors.push(error) }));
  expect(errors).toEqual([]);
  expect(el.textContent).toBe('client');
});
