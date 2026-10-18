// @vitest-environment happy-dom
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { useDate } from './useDate';

import i18n from '../../../i18n';

afterEach(async () => {
  await act(() => i18n.changeLanguage('en'));
});

describe('useDate identity', () => {
  it('returns the same toolkit on every render, so memos and effects that depend on it stay put', () => {
    const { result, rerender } = renderHook(() => useDate());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
    expect(result.current.formatDate).toBe(first.formatDate);
  });

  it('switches to a new toolkit (Arabic locale) when the language changes', async () => {
    const { result } = renderHook(() => useDate());
    const english = result.current;
    await act(() => i18n.changeLanguage('ar'));
    expect(result.current).not.toBe(english);
  });
});
