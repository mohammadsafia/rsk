// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Command } from '@components/ui';

afterEach(cleanup);

describe('Command', () => {
  it('is a raised surface with mono shortcut hints', () => {
    const { container } = render(
      <Command>
        <Command.List>
          <Command.Item>
            Duplicate <Command.Shortcut>⌘D</Command.Shortcut>
          </Command.Item>
        </Command.List>
      </Command>,
    );
    expect((container.firstElementChild as HTMLElement).className).toContain('bg-surface-raised');
    expect(screen.getByText('⌘D').className).toContain('font-mono');
  });
});
