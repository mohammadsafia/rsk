// @vitest-environment happy-dom
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';

import { useClinicToday } from './useClinicToday';

import '../../../i18n';

describe('useClinicToday', () => {
  it('keeps the same now between renders within a minute', () => {
    const { result, rerender } = renderHook(() => useClinicToday());
    const first = result.current.now;
    rerender();
    expect(result.current.now).toBe(first);
  });
});
