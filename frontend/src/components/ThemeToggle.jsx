import React from 'react';
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
      aria-label="Dark mode"
      title={`Dark mode ${isDark ? 'on' : 'off'}`}
    >
      <span>Dark mode</span>
      <span className="theme-toggle-track" aria-hidden="true">
        <span className="theme-toggle-thumb" />
      </span>
    </button>
  );
}