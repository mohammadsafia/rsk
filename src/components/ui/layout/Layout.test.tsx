// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Layout } from '@components/ui';

afterEach(cleanup);

describe('Layout', () => {
  it('paints its header and sidebar on the surface token', () => {
    render(
      <Layout>
        <Layout.Header data-testid="header">Top</Layout.Header>
        <Layout.Sidebar data-testid="sidebar">Nav</Layout.Sidebar>
      </Layout>,
    );
    expect(screen.getByTestId('header').className).toContain('bg-surface');
    expect(screen.getByTestId('sidebar').className).toContain('bg-surface');
  });
});
