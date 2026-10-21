import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';

import { isEqual } from '../utils/helper';
import { localStorageGetItem } from '../utils/storage-available';

// ----------------------------------------------------------------------

type StorageValue = string | number | boolean | object | null;

type UseLocalStorageReturn<T> = {
  state: T;
  setState: Dispatch<SetStateAction<T>>;
  setField: T extends object
    ? <K extends keyof T>(name: K, value: T[K]) => void
    : never;
  resetState: () => void;
  canReset: boolean;
};

// ----------------------------------------------------------------------

export function useLocalStorage<T extends StorageValue>(
  key: string,
  initialState: T
): UseLocalStorageReturn<T> {
  const [state, set] = useState<T>(initialState);

  const multiValue =
    initialState !== null &&
    typeof initialState === 'object' &&
    !Array.isArray(initialState);

  const canReset = !isEqual(state, initialState);

  // ----------------------------------------------------------------------

  useEffect(() => {
    const restoredValue = getStorage<T>(key);

    if (restoredValue === null) {
      return;
    }

    if (multiValue) {
      set((prevValue) => {
        if (
          typeof prevValue === 'object' &&
          prevValue !== null &&
          !Array.isArray(prevValue) &&
          typeof restoredValue === 'object' &&
          restoredValue !== null &&
          !Array.isArray(restoredValue)
        ) {
          return {
            ...prevValue,
            ...restoredValue,
          } as T;
        }

        return restoredValue;
      });
    } else {
      set(restoredValue);
    }
  }, [key, multiValue]);

  // ----------------------------------------------------------------------

  const setState = useCallback<Dispatch<SetStateAction<T>>>(
    (updateState) => {
      set((prevValue) => {
        const nextValue =
          typeof updateState === 'function'
            ? (updateState as (prevState: T) => T)(prevValue)
            : updateState;

        if (multiValue) {
          const mergedValue =
            typeof prevValue === 'object' &&
            prevValue !== null &&
            !Array.isArray(prevValue) &&
            typeof nextValue === 'object' &&
            nextValue !== null &&
            !Array.isArray(nextValue)
              ? {
                  ...prevValue,
                  ...nextValue,
                }
              : nextValue;

          setStorage(key, mergedValue);

          return mergedValue as T;
        }

        setStorage(key, nextValue);

        return nextValue;
      });
    },
    [key, multiValue]
  );

  // ----------------------------------------------------------------------

  const setField = useCallback(
    <K extends keyof T>(name: K, updateValue: T[K]) => {
      if (!multiValue) {
        return;
      }

      set((prevValue) => {
        if (
          typeof prevValue !== 'object' ||
          prevValue === null ||
          Array.isArray(prevValue)
        ) {
          return prevValue;
        }

        const nextValue = {
          ...prevValue,
          [name]: updateValue,
        } as T;

        setStorage(key, nextValue);

        return nextValue;
      });
    },
    [key, multiValue]
  );

  // ----------------------------------------------------------------------

  const resetState = useCallback(() => {
    set(initialState);
    removeStorage(key);
  }, [initialState, key]);

  // ----------------------------------------------------------------------

  return useMemo(
    () =>
      ({
        state,
        setState,
        setField: setField as UseLocalStorageReturn<T>['setField'],
        resetState,
        canReset,
      }) as UseLocalStorageReturn<T>,
    [canReset, resetState, setField, setState, state]
  );
}

// ----------------------------------------------------------------------

export function getStorage<T>(key: string): T | null {
  try {
    const result = localStorageGetItem(key);

    if (!result) {
      return null;
    }

    return JSON.parse(result) as T;
  } catch (error) {
    console.error('Error while getting from storage:', error);

    return null;
  }
}

// ----------------------------------------------------------------------

export function setStorage<T>(key: string, value: T): boolean {
  try {
    if (typeof window === 'undefined') {
      return false;
    }

    window.localStorage.setItem(key, JSON.stringify(value));

    return true;
  } catch (error) {
    console.error('Error while setting storage:', error);

    return false;
  }
}

// ----------------------------------------------------------------------

export function removeStorage(key: string): boolean {
  try {
    if (typeof window === 'undefined') {
      return false;
    }

    window.localStorage.removeItem(key);

    return true;
  } catch (error) {
    console.error('Error while removing from storage:', error);

    return false;
  }
}