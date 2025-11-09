import { ReactNode, useState, useEffect } from 'react';
import { MainLayout } from './layout/MainLayout';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { Navigate } from 'react-router-dom';
import ScrollManager from './ScrollManager';
import { CommandPalette, useCommandPalette } from './CommandPalette';
import { useKeyboardShortcuts, KeyboardShortcutsHelp } from '@/hooks/useKeyboardShortcuts';

interface LayoutProps {
  children?: ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  const { isAuthenticated } = useAuthStore();
  const { open, setOpen } = useCommandPalette(); // CMD+K command palette
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  // Show keyboard shortcuts help on '?'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowKeyboardHelp(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/signin" />;
  }

  return (
    <>
      <ScrollManager />

      {/* Command Palette (CMD+K) - KILLER FEATURE */}
      <CommandPalette open={open} onClose={() => setOpen(false)} />

      {/* Keyboard Shortcuts Help (Press ?) */}
      <KeyboardShortcutsHelp open={showKeyboardHelp} onClose={() => setShowKeyboardHelp(false)} />

      <MainLayout>
        {children || <Outlet />}
      </MainLayout>
    </>
  );
}
