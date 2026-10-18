import type { LegacyRef, MutableRefObject, RefCallback } from 'react';

/** One ref callback that hands the node to every given ref (objects and callbacks; empty and legacy string refs are skipped). */
export const mergeRefs =
  <T>(...refs: Array<LegacyRef<T> | undefined>): RefCallback<T> =>
  (node) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(node);
      else if (ref && typeof ref !== 'string') (ref as MutableRefObject<T | null>).current = node;
    }
  };
