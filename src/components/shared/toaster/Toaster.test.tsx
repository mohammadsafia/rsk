// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Toaster } from '@components/shared';

import i18n from '../../../i18n';

import { toast } from '@hooks/shared';

afterEach(cleanup);

describe('Toaster', () => {
  it('passes the tone of toast() through to the rendered toast', async () => {
    render(<Toaster />);
    act(() => {
      toast({ title: 'Record deleted', tone: 'danger' });
    });
    const rendered = (await screen.findByText('Record deleted')).closest('[data-slot="toast"]');
    expect(rendered?.getAttribute('data-tone')).toBe('danger');
  });

  it('rejects the removed variant key at compile time', () => {
    // @ts-expect-error — `variant` was replaced by `tone`
    const call = () => toast({ title: 'x', variant: 'destructive' });
    expect(call).toBeTypeOf('function');
  });

  it('names the notifications region in the app language', async () => {
    await act(() => i18n.changeLanguage('ar'));
    render(<Toaster />);
    expect(screen.getByRole('region', { name: /الإشعارات/ })).toBeTruthy();
    await act(() => i18n.changeLanguage('en'));
  });
});
