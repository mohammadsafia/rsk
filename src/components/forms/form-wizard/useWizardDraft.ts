'use client';

import { useEffect, useRef, useState } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';

const PREFIX = 'rsk:wizard:';
const SAVE_DELAY = 400;

type Draft = { values: Record<string, unknown>; stepId?: string; completed?: string[] };

const isFileLike = (value: unknown) =>
  (typeof File !== 'undefined' && value instanceof File) ||
  (typeof Blob !== 'undefined' && value instanceof Blob) ||
  (typeof FileList !== 'undefined' && value instanceof FileList);

/** Drops File, Blob and FileList values (recursively): they can't be stored and must be picked again. */
export const stripFiles = (value: unknown): unknown => {
  if (isFileLike(value)) return undefined;
  if (Array.isArray(value)) return value.filter((item) => !isFileLike(item)).map(stripFiles);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, item]) => [key, stripFiles(item)] as const)
        .filter(([, item]) => item !== undefined),
    );
  }
  return value;
};

const remove = (key: string) => {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Storage unavailable.
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

const read = (key: string): Draft | null => {
  let raw: string | null;
  try {
    raw = sessionStorage.getItem(key);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const draft = JSON.parse(raw) as unknown;
    if (isRecord(draft) && isRecord(draft.values)) {
      return {
        values: draft.values,
        stepId: typeof draft.stepId === 'string' ? draft.stepId : undefined,
        completed: Array.isArray(draft.completed) ? draft.completed.filter((id): id is string => typeof id === 'string') : [],
      };
    }
  } catch {
    // Unparseable: fall through and remove it.
  }
  remove(key);
  return null;
};

const write = (key: string, draft: Draft) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(draft));
  } catch {
    // Private mode or full storage: drafts are a convenience.
  }
};

/** Session draft for a wizard: restores on mount, saves (debounced) on change, cleared on submit or discard. */
export function useWizardDraft<TValues extends FieldValues>(
  draftKey: string | undefined,
  form: UseFormReturn<TValues>,
  position: { stepId: string | undefined; completed: ReadonlySet<string> },
  restore: (stepId: string | undefined, completed: string[]) => void,
) {
  const key = draftKey ? PREFIX + draftKey : undefined;
  const [restored, setRestored] = useState(false);
  const defaults = useRef(form.formState.defaultValues);
  const positionRef = useRef(position);
  positionRef.current = position;
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // After a submit or discard, a form.reset() must not write the draft back; the next edit resumes saving.
  const paused = useRef(false);

  useEffect(() => {
    if (!key) return;
    const draft = read(key);
    if (!draft) return;
    form.reset({ ...(defaults.current as object), ...draft.values } as TValues);
    restore(draft.stepId, draft.completed ?? []);
    setRestored(true);
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- restore once per key, on mount; form and restore are stable enough
  }, [key]);

  useEffect(() => {
    if (!key) return;
    const subscription = form.watch((values, { name }) => {
      if (paused.current && !name) return;
      paused.current = false;
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        const { stepId, completed } = positionRef.current;
        write(key, { values: stripFiles(values) as Record<string, unknown>, stepId, completed: [...completed] });
      }, SAVE_DELAY);
    });
    return () => {
      clearTimeout(timer.current);
      subscription.unsubscribe();
    };
  }, [key, form]);

  const stop = () => {
    clearTimeout(timer.current);
    paused.current = true;
    if (key) remove(key);
    setRestored(false);
  };

  return {
    restored,
    discard: () => {
      stop();
      form.reset(defaults.current as TValues);
      restore(undefined, []);
    },
    clear: stop,
  };
}
