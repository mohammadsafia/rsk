import { createRef } from 'react';
import { describe, expect, it, vi } from 'vite-plus/test';

import { mergeRefs } from './mergeRefs';

describe('mergeRefs', () => {
  it('hands the node to object refs, callback refs, and skips empty ones', () => {
    const object = createRef<HTMLDivElement>();
    const callback = vi.fn();
    const node = {} as HTMLDivElement;
    mergeRefs(object, callback, undefined, null)(node);
    expect(object.current).toBe(node);
    expect(callback).toHaveBeenCalledWith(node);
  });

  it('passes on the cleanup a React 19 callback ref returns', () => {
    const cleanupA = vi.fn();
    const merged = mergeRefs<HTMLDivElement>(() => cleanupA, createRef());
    const dispose = merged({} as HTMLDivElement);
    expect(typeof dispose).toBe('function');
    (dispose as () => void)();
    expect(cleanupA).toHaveBeenCalledTimes(1);
  });

  it('detaches every ref when one of them returns a cleanup: object refs go null, plain callbacks get null', () => {
    const object: { current: HTMLDivElement | null } = { current: null };
    const plain = vi.fn();
    const cleanup = vi.fn();
    const withCleanup = vi.fn(() => cleanup);
    const node = {} as HTMLDivElement;
    const detach = mergeRefs<HTMLDivElement>(object, plain, withCleanup)(node);
    expect(object.current).toBe(node);
    expect(typeof detach).toBe('function');
    (detach as () => void)();
    expect(object.current).toBeNull();
    expect(plain).toHaveBeenLastCalledWith(null);
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(withCleanup).toHaveBeenCalledTimes(1);
  });
});
