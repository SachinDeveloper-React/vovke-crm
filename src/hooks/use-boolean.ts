'use client';

import { useMemo, useState, useCallback } from 'react';

export function useBoolean(defaultValue: boolean = false) {
  const [value, setValue] = useState<boolean>(defaultValue);

  const onTrue = useCallback((): void => {
    setValue(true);
  }, []);

  const onFalse = useCallback((): void => {
    setValue(false);
  }, []);

  const onToggle = useCallback((): void => {
    setValue((prev: boolean) => !prev);
  }, []);

  const memoizedValue = useMemo(
    () => ({
      value,
      onTrue,
      onFalse,
      onToggle,
      setValue,
    }),
    [value, onTrue, onFalse, onToggle]
  );

  return memoizedValue;
}