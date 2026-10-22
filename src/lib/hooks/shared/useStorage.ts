'use client';

import { useCallback, useMemo } from 'react';

import { getPersistentData, persistData } from '@utils';

type StorageReturnType<TData, TDefault> = [TData | TDefault, (storageValue: TData) => void];

export const useStorage = <TData, TDefault = TData>(
  storageKey: string,
  defaultValue = null as TDefault,
): StorageReturnType<TData, TDefault> => {
  const storageValue = useMemo(() => {
    return getPersistentData<TData, TDefault>(storageKey, defaultValue);
  }, [defaultValue, storageKey]);

  const setStorageValue = useCallback(
    (storageValue: TData) => {
      persistData<TData>(storageKey, storageValue);
    },
    [storageKey],
  );

  return [storageValue, setStorageValue];
};
