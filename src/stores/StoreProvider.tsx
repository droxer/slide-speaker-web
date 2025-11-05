'use client';

import React, { useEffect } from 'react';
import { useThemeStore, applyThemeClasses } from './themeStore';
import { useUiStore } from './uiStore';

/**
 * Provider component that initializes stores and handles side effects
 * This component should be placed at the root of the application
 */
export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const { theme, mode } = useThemeStore();
  const { toast } = useUiStore();

  // Apply theme classes to body when theme or mode changes
  useEffect(() => {
    applyThemeClasses(theme);
  }, [theme, mode]);

  // Handle system theme changes when in auto mode
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (mode !== 'auto') return;

    const darkMedia = window.matchMedia('(prefers-color-scheme: dark)');

    const updateTheme = () => {
      const prefersDark = darkMedia.matches;
      applyThemeClasses(prefersDark ? 'dark' : 'light');
    };

    // Update theme immediately
    updateTheme();

    // Set up listeners for changes
    const darkListener = (event: MediaQueryListEvent) => updateTheme();

    // Use modern event listener API if available
    if (darkMedia.addEventListener) {
      darkMedia.addEventListener('change', darkListener);
      return () => {
        darkMedia.removeEventListener('change', darkListener);
      };
    }

    // Fallback to older API
    darkMedia.addListener(darkListener);
    return () => {
      darkMedia.removeListener(darkListener);
    };
  }, [mode]);

  // Handle toast notifications
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      useUiStore.getState().setToast(null);
    }, 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  return <>{children}</>;
};
