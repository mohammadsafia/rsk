// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { ScrollArea } from '@components/ui';

afterEach(cleanup);

describe('ScrollArea', () => {
  it('lets keyboard users reach and scroll its viewport (WCAG 2.1.1)', () => {
    render(<ScrollArea className="h-20">Long content</ScrollArea>);
    const viewport = document.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]')!;
    expect(viewport.getAttribute('tabindex')).toBe('0');
    expect(viewport.className).toContain('focus-ring');
  });
});
