import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeState {
  mode: ThemeMode;
  theme: 'light' | 'dark';
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const isBrowser = typeof window !== 'undefined';

const getPreferredTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';

  const darkMedia = window.matchMedia('(prefers-color-scheme: dark)');
  const contrastMedia = window.matchMedia('(prefers-contrast: more)');

  const prefersDark = darkMedia.matches;
  // Ignore high contrast preference and just use dark/light
  return prefersDark ? 'dark' : 'light';
};

const THEME_STORAGE_KEY = 'slidespeaker_ui_theme';

export const useThemeStore = create<ThemeState>()(
  devtools(
    persist(
      (set, get) => ({
        mode: 'auto',
        theme: 'light',
        setTheme: (mode) =>
          set((state) => {
            // When setting a specific mode, also update the theme
            let theme: 'light' | 'dark' = 'light';
            if (mode === 'auto') {
              theme = getPreferredTheme();
            } else if (mode === 'light' || mode === 'dark') {
              theme = mode;
            }
            return { mode, theme };
          }),
        toggleTheme: () =>
          set((state) => {
            let newMode: ThemeMode;
            let newTheme: 'light' | 'dark' = 'light';

            if (state.mode === 'auto') {
              // Toggle between light and dark when in auto mode
              newMode = state.theme === 'dark' ? 'light' : 'dark';
              newTheme = newMode;
            } else if (state.mode === 'light') {
              newMode = 'dark';
              newTheme = 'dark';
            } else if (state.mode === 'dark') {
              newMode = 'light';
              newTheme = 'light';
            } else {
              newMode = 'light';
              newTheme = 'light';
            }

            return { mode: newMode, theme: newTheme };
          }),
      }),
      {
        name: THEME_STORAGE_KEY,
        partialize: (state) => ({ mode: state.mode }),
        onRehydrateStorage: () => (state) => {
          if (!state) return;

          // Update theme based on mode when rehydrating
          if (isBrowser) {
            if (state.mode === 'auto') {
              state.theme = getPreferredTheme();
            } else if (state.mode === 'light' || state.mode === 'dark') {
              state.theme = state.mode;
            }
          }
        },
      }
    )
  )
);

// Helper function to apply theme classes to body
export const applyThemeClasses = (theme: 'light' | 'dark') => {
  if (typeof document === 'undefined') return;

  const body = document.body;
  const isLight = theme === 'light';
  const isDark = theme === 'dark';

  body.classList.toggle('theme-light', isLight);
  body.classList.toggle('theme-dark', isDark);
  body.classList.toggle('light-theme', isLight);
  body.classList.toggle('dark-theme', isDark);
};
