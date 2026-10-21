const STORAGE_TEST_KEY = '__storage_test__';

// ----------------------------------------------------------------------

export function localStorageAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const storage = window.localStorage;

    storage.setItem(STORAGE_TEST_KEY, STORAGE_TEST_KEY);
    storage.removeItem(STORAGE_TEST_KEY);

    return true;
  } catch {
    return false;
  }
}

// ----------------------------------------------------------------------

export function localStorageGetItem<T = string>(
  key: string,
  defaultValue: T = '' as T
): string | T {
  if (!localStorageAvailable()) {
    return defaultValue;
  }

  try {
    const value = window.localStorage.getItem(key);

    return value ?? defaultValue;
  } catch {
    return defaultValue;
  }
}