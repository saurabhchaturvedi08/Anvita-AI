import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ] as const;

  return (
    <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`p-2 rounded-md transition-all duration-200 ${
            theme === value
              ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
          title={label}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}