import { useEffect, useRef, useState } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';

const PREFIX = 'rsk:wizard:';
const SAVE_DELAY = 400;

type Draft = { values: Record<string, unknown>; step: number };

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

const read = (key: string): Draft | null => {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Draft;
    return draft && typeof draft === 'object' && draft.values ? draft : null;
  } catch {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Storage unavailable.
    }
    return null;
  }
};

const write = (key: string, draft: Draft) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(draft));
  } catch {
    // Private mode or full storage: drafts are a convenience.
  }
};

const remove = (key: string) => {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Storage unavailable.
  }
};

/** Session draft for a wizard: restores on mount, saves (debounced) on change, cleared on submit or discard. */
export function useWizardDraft<TValues extends FieldValues>(
  draftKey: string | undefined,
  form: UseFormReturn<TValues>,
  step: number,
  setStep: (index: number) => void,
) {
  const key = draftKey ? PREFIX + draftKey : undefined;
  const [restored, setRestored] = useState(false);
  const defaults = useRef(form.formState.defaultValues);
  const stepRef = useRef(step);
  stepRef.current = step;

  useEffect(() => {
    if (!key) return;
    const draft = read(key);
    if (!draft) return;
    form.reset({ ...(defaults.current as object), ...draft.values } as TValues);
    setStep(draft.step ?? 0);
    setRestored(true);
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- restore once per key, on mount; form and setStep are stable enough
  }, [key]);

  useEffect(() => {
    if (!key) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const subscription = form.watch((values) => {
      clearTimeout(timer);
      timer = setTimeout(() => write(key, { values: stripFiles(values) as Record<string, unknown>, step: stepRef.current }), SAVE_DELAY);
    });
    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [key, form]);

  return {
    restored,
    discard: () => {
      if (key) remove(key);
      form.reset(defaults.current as TValues);
      setStep(0);
      setRestored(false);
    },
    clear: () => {
      if (key) remove(key);
      setRestored(false);
    },
  };
}
