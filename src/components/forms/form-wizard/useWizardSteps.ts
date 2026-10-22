'use client';

import { useCallback, useState } from 'react';

/** Current step, completed/errored sets and the jump rule: a step is reachable when every earlier step is completed. */
export function useWizardSteps(ids: string[], initialIndex = 0) {
  const [index, setIndex] = useState(initialIndex);
  const [completed, setCompleted] = useState<ReadonlySet<string>>(new Set());
  const [errored, setErrored] = useState<ReadonlySet<string>>(new Set());

  const safeIndex = Math.min(index, Math.max(0, ids.length - 1));
  const canJumpTo = useCallback(
    (target: number) => target <= safeIndex || ids.slice(0, target).every((id) => completed.has(id)),
    [ids, completed, safeIndex],
  );
  const goTo = useCallback((target: number) => setIndex(Math.max(0, Math.min(ids.length - 1, target))), [ids.length]);

  return {
    index: safeIndex,
    currentId: ids[safeIndex],
    completed,
    errored,
    canJumpTo,
    goTo,
    markCompleted: (id: string) => {
      setCompleted((current) => new Set(current).add(id));
      setErrored((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    },
    markErrored: (stepIds: string[]) => setErrored((current) => new Set([...current, ...stepIds])),
    /** A passed step that no longer validates: shows the error status and locks the steps after it. */
    markInvalid: (stepIds: string[]) => {
      setCompleted((current) => new Set([...current].filter((id) => !stepIds.includes(id))));
      setErrored((current) => new Set([...current, ...stepIds]));
    },
    /** Restores a saved position (from a draft): the step and the steps already passed. */
    restore: (target: number, completedIds: string[]) => {
      setCompleted(new Set(completedIds.filter((id) => ids.includes(id))));
      setIndex(Math.max(0, Math.min(ids.length - 1, target)));
    },
  };
}
