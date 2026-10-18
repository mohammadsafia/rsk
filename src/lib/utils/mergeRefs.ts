import type { Ref, RefCallback } from 'react';

/**
 * One ref callback that hands the node to every given ref (objects and callbacks). React 19 callback refs may return
 * a cleanup, and a ref that returns one is never called with null — so the merged ref always returns a cleanup that
 * detaches each ref the way it expects: its own cleanup if it gave one, else `null` (callbacks) or `current = null`.
 */
export const mergeRefs =
  <T>(...refs: Array<Ref<T> | undefined>): RefCallback<T> =>
  (node) => {
    const detach: Array<() => void> = [];
    for (const ref of refs) {
      if (typeof ref === 'function') {
        const cleanup = ref(node);
        detach.push(typeof cleanup === 'function' ? cleanup : () => ref(null));
      } else if (ref) {
        ref.current = node;
        detach.push(() => {
          ref.current = null;
        });
      }
    }
    return () => detach.forEach((run) => run());
  };
