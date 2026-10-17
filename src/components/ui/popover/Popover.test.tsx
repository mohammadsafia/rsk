// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Popover } from '@components/ui';

afterEach(cleanup);

describe('Popover', () => {
  it('renders content on the raised floating surface with the shared motion', () => {
    render(
      <Popover defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>Body</Popover.Content>
      </Popover>,
    );
    const content = screen.getByText('Body').closest('[data-slot="popover-content"]');
    expect(content?.className).toContain('bg-surface-raised');
    expect(content?.className).toContain('data-[state=open]:zoom-in-96');
    expect(content?.className).toContain('data-[state=open]:duration-fast');
    expect(content?.className).toContain('data-[state=closed]:duration-instant');
    expect(content?.className).toContain('data-[state=closed]:ease-in');
    expect(content?.className).toContain('data-[side=top]:slide-in-from-bottom-1');
    expect(content?.className).toContain('origin-(--radix-popover-content-transform-origin)');
    expect(content?.className).not.toContain('bg-popover');
  });
});
