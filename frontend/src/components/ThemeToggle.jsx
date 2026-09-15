import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../services/theme.js';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="dropdown-item theme-toggle"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
    </button>
  );
}