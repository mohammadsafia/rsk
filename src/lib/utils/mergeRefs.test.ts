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
});
