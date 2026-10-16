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

  return {
    index: safeIndex,
    currentId: ids[safeIndex],
    completed,
    errored,
    canJumpTo,
    goTo: (target: number) => setIndex(Math.max(0, Math.min(ids.length - 1, target))),
    markCompleted: (id: string) => {
      setCompleted((current) => new Set(current).add(id));
      setErrored((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    },
    markErrored: (stepIds: string[]) => setErrored((current) => new Set([...current, ...stepIds])),
  };
}
