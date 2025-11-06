/**
 * Modern Workflow New Page
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

export function ModernWorkflowNew() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-6">
          Create New Workflow
        </h1>
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
          <p className="text-neutral-600 dark:text-neutral-400">
            Workflow creation coming soon. For now, please use the workflows list.
          </p>
          <button
            onClick={() => navigate('/workflows')}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Back to Workflows
          </button>
        </div>
      </div>
    </div>
  );
}
