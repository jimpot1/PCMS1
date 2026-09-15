import { useEffect, useState } from 'react';

export const THEME_KEY = 'pcms_theme';

export function getSavedTheme() {
  return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
}

export function applyAuthenticatedTheme(theme) {
  document.body.classList.toggle('pcms-dark', theme === 'dark');
}

export function useTheme() {
  const [theme, setThemeState] = useState(() => getSavedTheme());

  useEffect(() => {
    const handleThemeChange = (event) => {
      setThemeState(event.detail?.theme || getSavedTheme());
    };
    window.addEventListener('pcms:theme-changed', handleThemeChange);
    return () => window.removeEventListener('pcms:theme-changed', handleThemeChange);
  }, []);

  const setTheme = (nextTheme) => {
    const resolvedTheme = nextTheme === 'dark' ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, resolvedTheme);
    applyAuthenticatedTheme(resolvedTheme);
    window.dispatchEvent(new CustomEvent('pcms:theme-changed', { detail: { theme: resolvedTheme } }));
  };

  return { theme, toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark') };
}