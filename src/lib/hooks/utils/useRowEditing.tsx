import { createContext, type FC, type ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react';

import type {
  ArrayPath,
  FieldArray,
  FieldPath,
  FieldValues,
  Path,
  UseFieldArrayReturn,
  UseFormReturn,
} from 'react-hook-form';

export type RowEditingMode = 'single' | 'multi';

export type RowStatus = 'idle' | 'editing' | 'creating' | 'saving' | 'error';

export type RowEditingActionContext = {
  isNew: boolean;
  index: number;
  rowId: string;
};

export type PersistFn<TRow> = (row: TRow, ctx: RowEditingActionContext) => Promise<TRow | void>;

export type UseRowEditingOptions<
  TRow extends FieldValues,
  TForm extends FieldValues = FieldValues,
  TKeyName extends string = 'id',
> = {
  form: UseFormReturn<TForm>;
  fieldArray: UseFieldArrayReturn<TForm, ArrayPath<TForm>, TKeyName>;
  arrayName: ArrayPath<TForm>;
  mode?: RowEditingMode;
  rowIdKey?: keyof TRow & string;
  generateRowId?: () => string;
};

export type UseRowEditingReturn<TRow extends FieldValues> = {
  /**
   * Returns true while the row is in any active edit lifecycle (`editing | creating | saving | error`).
   * For the strict editing-only check, use `getStatus(rowId) === 'editing'`.
   */
  isEditing: (rowId: string) => boolean;
  isAnyEditing: boolean;
  dirtyCount: number;
  getStatus: (rowId: string) => RowStatus;
  getError: (rowId: string) => unknown;
  /**
   * Builds the RHF field path for a cell input — `${arrayName}.${index}.${path}` — with the
   * row index resolved at call time. Use at the cell to avoid threading `arrayName` /
   * resolving the row index manually.
   */
  fieldName: <TPath extends FieldPath<TRow>>(rowId: string, path: TPath) => string;
  enterEdit: (rowId: string) => void;
  /**
   * Low-level escape hatch: clears the row's edit status + snapshot without restoring values or
   * committing changes. In normal flows prefer `cancel(rowId)` (discard) or
   * `save(rowId, persist)` (commit) — they both call this internally.
   */
  exitEdit: (rowId: string) => void;
  save: (rowId: string, persist: PersistFn<TRow>) => Promise<void>;
  cancel: (rowId: string) => void;
  addRow: (defaults?: Partial<TRow>) => string;
  removeRow: (rowId: string) => void;
  moveRow: (rowId: string, direction: 'up' | 'down') => void;
};

export type RowEditingContextValue<TRow extends FieldValues> = UseRowEditingReturn<TRow>;

const RowEditingContext = createContext<RowEditingContextValue<FieldValues> | null>(null);

export const useRowEditingContext = <TRow extends FieldValues = FieldValues>(): RowEditingContextValue<TRow> => {
  const ctx = useContext(RowEditingContext) as RowEditingContextValue<TRow> | null;

  if (!ctx) throw new Error('useRowEditingContext must be used within a <RowEditingProvider />');

  return ctx;
};

const defaultGenerateRowId = (): string => crypto.randomUUID();

const ACTIVE_STATUSES: ReadonlySet<RowStatus> = new Set(['editing', 'creating', 'saving', 'error']);

const DIRTY_STATUSES: ReadonlySet<RowStatus> = new Set(['editing', 'creating', 'error']);

// Subscription ceiling note: the whole edit state lives in one context value, so every cell
// in the table re-renders when any row's status toggles. Acceptable at small/medium row counts.
// If a table ever grows to hundreds of editable rows, swap this for a per-row subscription
// store (Zustand / a tiny external store) so toggling one row no longer re-renders the rest.

export const useRowEditing = <
  TRow extends FieldValues,
  TForm extends FieldValues = FieldValues,
  TKeyName extends string = 'id',
>(
  options: UseRowEditingOptions<TRow, TForm, TKeyName>,
): UseRowEditingReturn<TRow> => {
  const {
    form,
    fieldArray,
    arrayName,
    mode = 'multi',
    rowIdKey = '_rowId' as keyof TRow & string,
    generateRowId = defaultGenerateRowId,
  } = options;

  const [statusMap, setStatusMap] = useState<Map<string, RowStatus>>(() => new Map());
  const statusMapRef = useRef<Map<string, RowStatus>>(new Map());
  const snapshotsRef = useRef<Map<string, TRow>>(new Map());
  const errorsRef = useRef<Map<string, unknown>>(new Map());

  const indexOf = useCallback(
    (rowId: string): number =>
      fieldArray.fields.findIndex(
        (f) => String((f as Record<string, unknown>)[rowIdKey] ?? '') === rowId,
      ),
    [fieldArray, rowIdKey],
  );

  const setStatus = useCallback((rowId: string, status: RowStatus, error?: unknown) => {
    if (status === 'error') {
      errorsRef.current.set(rowId, error);
    } else {
      errorsRef.current.delete(rowId);
    }

    setStatusMap((prev) => {
      const next = new Map(prev);
      next.set(rowId, status);
      statusMapRef.current = next;
      return next;
    });
  }, []);

  const clearStatus = useCallback((rowId: string) => {
    errorsRef.current.delete(rowId);
    setStatusMap((prev) => {
      if (!prev.has(rowId)) return prev;
      const next = new Map(prev);
      next.delete(rowId);
      statusMapRef.current = next;
      return next;
    });
  }, []);

  const getStatus = useCallback((rowId: string): RowStatus => statusMap.get(rowId) ?? 'idle', [statusMap]);

  const getError = useCallback((rowId: string): unknown => errorsRef.current.get(rowId), []);

  const dirtyCount = useMemo(() => {
    let count = 0;
    for (const status of statusMap.values()) {
      if (DIRTY_STATUSES.has(status)) count += 1;
    }
    return count;
  }, [statusMap]);

  const isEditing = useCallback(
    (rowId: string): boolean => ACTIVE_STATUSES.has(statusMap.get(rowId) ?? 'idle'),
    [statusMap],
  );

  const isAnyEditing = useMemo(() => {
    for (const status of statusMap.values()) {
      if (ACTIVE_STATUSES.has(status)) return true;
    }
    return false;
  }, [statusMap]);

  const fieldName = useCallback(
    <TPath extends FieldPath<TRow>>(rowId: string, path: TPath): string => {
      const idx = indexOf(rowId);
      return `${arrayName}.${idx}.${path}`;
    },
    [arrayName, indexOf],
  );

  const exitEdit = useCallback(
    (rowId: string) => {
      snapshotsRef.current.delete(rowId);
      clearStatus(rowId);
    },
    [clearStatus],
  );

  const enterEdit = useCallback(
    (rowId: string): void => {
      if (mode === 'single' && isAnyEditing && !isEditing(rowId)) return;

      const idx = indexOf(rowId);
      if (idx < 0) return;

      const snapshot = structuredClone(form.getValues(`${arrayName}.${idx}` as Path<TForm>)) as TRow;
      snapshotsRef.current.set(rowId, snapshot);
      setStatus(rowId, 'editing');
    },
    [arrayName, form, indexOf, isAnyEditing, isEditing, mode, setStatus],
  );

  const cancel = useCallback(
    (rowId: string) => {
      const status = statusMap.get(rowId) ?? 'idle';

      if (status === 'creating') {
        const idx = indexOf(rowId);
        if (idx >= 0) fieldArray.remove(idx);
        exitEdit(rowId);
        return;
      }

      const snapshot = snapshotsRef.current.get(rowId);
      const idx = indexOf(rowId);

      if (snapshot === undefined || idx < 0) {
        exitEdit(rowId);
        return;
      }

      const path = `${arrayName}.${idx}` as Path<TForm>;
      form.setValue(path, snapshot as unknown as never, { shouldDirty: false });
      form.clearErrors(path);
      exitEdit(rowId);
    },
    [arrayName, exitEdit, fieldArray, form, indexOf, statusMap],
  );

  const save = useCallback(
    async (rowId: string, persist: PersistFn<TRow>): Promise<void> => {
      const index = indexOf(rowId);
      if (index < 0) return;

      const path = `${arrayName}.${index}` as Path<TForm>;
      const ok = await form.trigger(path);
      if (!ok) {
        setStatus(rowId, 'error');
        return;
      }

      const isNew = (statusMapRef.current.get(rowId) ?? 'idle') === 'creating';
      setStatus(rowId, 'saving');

      try {
        const row = form.getValues(path) as TRow;
        const mapped = await persist(row, { isNew, index, rowId });

        if (mapped) {
          fieldArray.update(index, mapped as unknown as FieldArray<TForm, ArrayPath<TForm>>);
        }

        exitEdit(rowId);
      } catch (error) {
        setStatus(rowId, 'error', error);
      }
    },
    [arrayName, exitEdit, fieldArray, form, indexOf, setStatus],
  );

  const addRow = useCallback(
    (defaults?: Partial<TRow>): string => {
      const rowId = generateRowId();
      const newRow = { ...defaults, [rowIdKey]: rowId } as unknown as FieldArray<TForm, ArrayPath<TForm>>;

      fieldArray.append(newRow);
      setStatus(rowId, 'creating');

      return rowId;
    },
    [fieldArray, generateRowId, rowIdKey, setStatus],
  );

  const removeRow = useCallback(
    (rowId: string) => {
      const idx = indexOf(rowId);
      if (idx < 0) return;

      fieldArray.remove(idx);
      exitEdit(rowId);
    },
    [exitEdit, fieldArray, indexOf],
  );

  const moveRow = useCallback(
    (rowId: string, direction: 'up' | 'down') => {
      const from = indexOf(rowId);
      if (from < 0) return;

      const to = direction === 'up' ? from - 1 : from + 1;
      if (to < 0 || to >= fieldArray.fields.length) return;

      fieldArray.move(from, to);
    },
    [fieldArray, indexOf],
  );

  return useMemo<UseRowEditingReturn<TRow>>(
    () => ({
      isEditing,
      isAnyEditing,
      dirtyCount,
      getStatus,
      getError,
      fieldName,
      enterEdit,
      exitEdit,
      save,
      cancel,
      addRow,
      removeRow,
      moveRow,
    }),
    [
      isEditing,
      isAnyEditing,
      dirtyCount,
      getStatus,
      getError,
      fieldName,
      enterEdit,
      exitEdit,
      save,
      cancel,
      addRow,
      removeRow,
      moveRow,
    ],
  );
};

export type RowEditingProviderProps<TRow extends FieldValues> = {
  edit: UseRowEditingReturn<TRow>;
  children: ReactNode;
};

export const RowEditingProvider = <TRow extends FieldValues>({
  edit,
  children,
}: RowEditingProviderProps<TRow>): ReturnType<FC> => {
  return (
    <RowEditingContext.Provider value={edit as unknown as RowEditingContextValue<FieldValues>}>
      {children}
    </RowEditingContext.Provider>
  );
};
