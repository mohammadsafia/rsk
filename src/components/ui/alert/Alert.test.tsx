// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Alert } from '@components/ui';

afterEach(cleanup);

describe('Alert', () => {
  it('danger alerts interrupt (role=alert)', () => {
    render(
      <Alert tone="danger">
        <Alert.Title>Claim rejected</Alert.Title>
      </Alert>,
    );
    expect(screen.getByRole('alert').dataset.tone).toBe('danger');
  });

  it('other tones are polite (role=status)', () => {
    render(
      <Alert tone="warning" variant="outline">
        <Alert.Title>Insurance expires soon</Alert.Title>
      </Alert>,
    );
    const alert = screen.getByRole('status');
    expect([alert.dataset.variant, alert.dataset.tone]).toEqual(['outline', 'warning']);
  });

  it('outline alerts carry no side stripe', () => {
    render(
      <Alert tone="info" variant="outline">
        <Alert.Title>Synced</Alert.Title>
      </Alert>,
    );
    expect(screen.getByRole('status').className).not.toMatch(/border-(s|l|inline-start)-/);
  });

  it('fades in when it appears (and not under reduced motion)', () => {
    render(<Alert tone="info">Saved</Alert>);
    const className = screen.getByText('Saved').closest('[data-slot="alert"]')!.className;
    for (const name of ['animate-in', 'fade-in-0', 'duration-base', 'ease-out', 'motion-reduce:animate-none'])
      expect(className).toContain(name);
  });
});
