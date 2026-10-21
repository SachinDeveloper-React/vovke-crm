'use client';

import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { STORAGE_KEY } from '../config-settings';
import { useLocalStorage } from '@/src/hooks/use-local-storage';

// ----------------------------------------------------------------------

export type Settings = Record<string, unknown>;

export type SettingsContextValue = Settings & {
  canReset: boolean;
  onReset: () => void;
  onUpdate: (value: Settings | ((prev: Settings) => Settings)) => void;
  onUpdateField: <K extends keyof Settings>(
    name: K,
    value: Settings[K]
  ) => void;
  openDrawer: boolean;
  onCloseDrawer: () => void;
  onToggleDrawer: () => void;
};

// ----------------------------------------------------------------------

export const SettingsContext =
  createContext<SettingsContextValue | undefined>(undefined);

export const SettingsConsumer = SettingsContext.Consumer;

// ----------------------------------------------------------------------

type SettingsProviderProps = {
  children: ReactNode;
  settings: Settings;
};

// ----------------------------------------------------------------------

export function SettingsProvider({
  children,
  settings,
}: SettingsProviderProps) {
  const localStorage = useLocalStorage<Settings>(
    STORAGE_KEY,
    settings
  );

  const [openDrawer, setOpenDrawer] = useState<boolean>(false);

  // ----------------------------------------------------------------------

  const onToggleDrawer = useCallback(() => {
    setOpenDrawer((prev) => !prev);
  }, []);

  // ----------------------------------------------------------------------

  const onCloseDrawer = useCallback(() => {
    setOpenDrawer(false);
  }, []);

  // ----------------------------------------------------------------------

  const memoizedValue = useMemo<SettingsContextValue>(
    () => ({
      ...localStorage.state,

      canReset: localStorage.canReset,
      onReset: localStorage.resetState,
      onUpdate: localStorage.setState,
      onUpdateField: localStorage.setField,

      openDrawer,
      onCloseDrawer,
      onToggleDrawer,
    }),
    [
      localStorage.state,
      localStorage.canReset,
      localStorage.resetState,
      localStorage.setState,
      localStorage.setField,
      openDrawer,
      onCloseDrawer,
      onToggleDrawer,
    ]
  );

  return (
    <SettingsContext.Provider value={memoizedValue}>
      {children}
    </SettingsContext.Provider>
  );
}