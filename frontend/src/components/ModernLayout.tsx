/**
 * Modern Layout
 * Wrapper for ModernSidebar + main content area
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { ModernSidebar } from './ModernSidebar';

export function ModernLayout() {
  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-900">
      <ModernSidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
