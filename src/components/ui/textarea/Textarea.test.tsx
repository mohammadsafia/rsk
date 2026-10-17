// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Textarea } from '@components/ui';

afterEach(cleanup);

describe('Textarea', () => {
  it('uses the field shape, grows with content and exposes invalid', () => {
    render(<Textarea aria-label="Notes" invalid />);
    const textarea = screen.getByRole('textbox', { name: 'Notes' });
    expect(textarea.className).toContain('border-border-strong');
    expect(textarea.className).toContain('min-h-20');
    expect(textarea.className).not.toContain('h-control-md');
    expect(textarea.getAttribute('aria-invalid')).toBe('true');
  });
});
