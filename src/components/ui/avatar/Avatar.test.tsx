// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Avatar } from '@components/ui';

afterEach(cleanup);

const renderAvatar = (size?: 'sm' | 'md' | 'lg') =>
  render(
    <Avatar size={size} data-testid="avatar">
      <Avatar.Image src="/missing.png" alt="" />
      <Avatar.Fallback>LH</Avatar.Fallback>
    </Avatar>,
  );

describe('Avatar', () => {
  it('defaults to md (32px)', () => {
    renderAvatar();
    const avatar = screen.getByTestId('avatar');
    expect(avatar.dataset.size).toBe('md');
    expect(avatar.className).toContain('size-8');
  });

  it('sizes sm to 24px and lg to 40px', () => {
    renderAvatar('sm');
    expect(screen.getByTestId('avatar').className).toContain('size-6');
    cleanup();
    renderAvatar('lg');
    expect(screen.getByTestId('avatar').className).toContain('size-10');
  });

  it('renders muted initials on the hover tint', async () => {
    renderAvatar();
    const fallback = await screen.findByText('LH');
    expect(fallback.className).toContain('bg-hover');
    expect(fallback.className).toContain('text-fg-muted');
  });
});
