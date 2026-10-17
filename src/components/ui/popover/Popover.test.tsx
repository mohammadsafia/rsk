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
    expect(content?.className).toContain('zoom-in-98');
    expect(content?.className).not.toContain('bg-popover');
  });
});
