/**
 * Dark Mode Toggle Component
 *
 * SALESFORCE: No dark mode toggle
 * LEADLAB: Beautiful animated toggle with light/dark/system options
 *
 * Small details matter - this is polish!
 */

import { Moon, Sun, Monitor } from 'lucide-react';
import { useDarkMode } from '../ThemeProvider';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './Dropdown';

export function DarkModeToggle({ className }: { className?: string }) {
  const { theme, actualTheme, setTheme } = useDarkMode();

  const Icon = actualTheme === 'dark' ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'inline-flex items-center justify-center rounded-lg p-2',
            'hover:bg-accent hover:text-accent-foreground',
            'transition-colors duration-200',
            className
          )}
          title="Toggle theme"
        >
          <Icon className="h-5 w-5 transition-transform duration-300" />
          <span className="sr-only">Toggle theme</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className={cn(theme === 'light' && 'bg-accent')}
        >
          <Sun className="w-4 h-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className={cn(theme === 'dark' && 'bg-accent')}
        >
          <Moon className="w-4 h-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className={cn(theme === 'system' && 'bg-accent')}
        >
          <Monitor className="w-4 h-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Simple toggle button (no dropdown)
export function DarkModeToggleSimple({ className }: { className?: string }) {
  const { toggleTheme, actualTheme } = useDarkMode();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'inline-flex items-center justify-center rounded-lg p-2',
        'hover:bg-accent hover:text-accent-foreground',
        'transition-all duration-300',
        className
      )}
      title="Toggle theme"
    >
      {actualTheme === 'dark' ? (
        <Moon className="h-5 w-5 rotate-0 scale-100 transition-all" />
      ) : (
        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
