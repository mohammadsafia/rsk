import { describe, it, expect, vi } from 'vitest';

const renderMock = vi.fn();

vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({ render: renderMock, unmount: vi.fn() })),
}));
vi.mock('@api/config', () => ({ queryClient: {} }));
vi.mock('@routes', () => ({ ROUTER: {} }));
vi.mock('@contexts', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  AppDirectionProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('./i18n', () => ({}));
vi.mock('./index.css', () => ({}));

import { createRoot } from 'react-dom/client';
import { renderApp } from './bootstrap';

describe('renderApp', () => {
  it('mounts the app into the supplied container', () => {
    const container = {} as unknown as HTMLElement;
    renderApp(container);
    expect(createRoot).toHaveBeenCalledWith(container);
    expect(renderMock).toHaveBeenCalledTimes(1);
  });
});
