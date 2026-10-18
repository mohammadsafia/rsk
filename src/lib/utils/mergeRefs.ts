import type { Ref, RefCallback } from 'react';

/**
 * One ref callback that hands the node to every given ref (objects and callbacks). React 19 callback refs may return
 * a cleanup; the merged ref returns one that runs them all.
 */
export const mergeRefs =
  <T>(...refs: Array<Ref<T> | undefined>): RefCallback<T> =>
  (node) => {
    const cleanups: Array<() => void> = [];
    for (const ref of refs) {
      if (typeof ref === 'function') {
        const cleanup = ref(node);
        if (typeof cleanup === 'function') cleanups.push(cleanup);
      } else if (ref) ref.current = node;
    }
    if (cleanups.length) return () => cleanups.forEach((cleanup) => cleanup());
  };
