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

  it('swipes toward the inline-end edge in both directions', async () => {
    await act(() => i18n.changeLanguage('ar'));
    render(<Toaster />);
    act(() => {
      toast({ title: 'تم الحفظ' });
    });
    expect((await screen.findByText('تم الحفظ')).closest('[data-slot="toast"]')?.getAttribute('data-swipe-direction')).toBe('left');
    cleanup();
    await act(() => i18n.changeLanguage('en'));
    render(<Toaster />);
    act(() => {
      toast({ title: 'Saved' });
    });
    expect((await screen.findByText('Saved')).closest('[data-slot="toast"]')?.getAttribute('data-swipe-direction')).toBe('right');
  });
});
