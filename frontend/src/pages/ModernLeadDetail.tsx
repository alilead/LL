/**
 * Modern Lead Detail Page
 * Uses new design system colors and dark mode
 */

import React from 'react';
import { LeadDetail } from './Leads/LeadDetail';

// This wraps the existing detail page
// The existing page already has good components (Tabs, Cards, etc.)
// We just need to ensure it uses the modern layout

export function ModernLeadDetail() {
  return (
    <div className="modern-lead-detail">
      <LeadDetail />
      <style>{`
        /* Override old color classes with modern design system */
        .modern-lead-detail .bg-gray-50 { background-color: rgb(250 250 250) !important; }
        .modern-lead-detail .bg-gray-100 { background-color: rgb(245 245 245) !important; }
        .modern-lead-detail .border-gray-200 { border-color: rgb(229 229 229) !important; }
        .modern-lead-detail .text-gray-500 { color: rgb(115 115 115) !important; }
        .modern-lead-detail .text-gray-600 { color: rgb(82 82 82) !important; }
        .modern-lead-detail .text-gray-700 { color: rgb(64 64 64) !important; }
        .modern-lead-detail .text-gray-900 { color: rgb(23 23 23) !important; }
        
        /* Dark mode support */
        .dark .modern-lead-detail .bg-gray-50 { background-color: rgb(23 23 23) !important; }
        .dark .modern-lead-detail .bg-gray-100 { background-color: rgb(38 38 38) !important; }
        .dark .modern-lead-detail .border-gray-200 { border-color: rgb(64 64 64) !important; }
        .dark .modern-lead-detail .text-gray-500 { color: rgb(163 163 163) !important; }
        .dark .modern-lead-detail .text-gray-600 { color: rgb(212 212 212) !important; }
        .dark .modern-lead-detail .text-gray-700 { color: rgb(229 229 229) !important; }
        .dark .modern-lead-detail .text-gray-900 { color: rgb(250 250 250) !important; }
      `}</style>
    </div>
  );
}
