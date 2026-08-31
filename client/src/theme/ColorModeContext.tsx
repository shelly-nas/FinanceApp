import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { PaletteMode } from '@mui/material';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'financeapp:theme-mode';

// The order the toggle icon cycles through.
const MODE_ORDER: ThemeMode[] = ['system', 'light', 'dark'];

type ColorModeContextType = {
  /** The user's preference: light, dark or system. */
  mode: ThemeMode;
  /** The mode actually rendered - 'system' resolved against the OS setting. */
  resolvedMode: PaletteMode;
  setMode: (mode: ThemeMode) => void;
  /** Advance to the next mode: system -> light -> dark -> system. */
  toggleMode: () => void;
};

const ColorModeContext = createContext<ColorModeContextType | undefined>(undefined);

const readStoredMode = (): ThemeMode => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    // Storage can be unavailable (private mode, blocked cookies) - fall through.
  }
  return 'system';
};

const getSystemMode = (): PaletteMode =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

export const ColorModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(readStoredMode);
  const [systemMode, setSystemMode] = useState<PaletteMode>(getSystemMode);

  // Follow the OS setting while it changes, so 'system' stays live.
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemMode(event.matches ? 'dark' : 'light');
    };
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Preference simply won't persist across reloads.
    }
  };

  const value = useMemo<ColorModeContextType>(() => {
    const resolvedMode = mode === 'system' ? systemMode : mode;
    return {
      mode,
      resolvedMode,
      setMode,
      toggleMode: () => setMode(MODE_ORDER[(MODE_ORDER.indexOf(mode) + 1) % MODE_ORDER.length]),
    };
  }, [mode, systemMode]);

  return <ColorModeContext.Provider value={value}>{children}</ColorModeContext.Provider>;
};

export const useColorMode = () => {
  const context = useContext(ColorModeContext);
  if (!context) {
    throw new Error('useColorMode must be used within a ColorModeProvider');
  }
  return context;
};
