/**
 * Modern Conversation Upload Page
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, ArrowLeft } from 'lucide-react';

export function ModernConversationUpload() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/conversations')}
          className="mb-6 flex items-center space-x-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Conversations</span>
        </button>
        
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-6">
          Upload Call Recording
        </h1>
        
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-8 border border-neutral-200 dark:border-neutral-700">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
              Upload Call Recording
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 text-center">
              Drag and drop your audio file here, or click to browse
            </p>
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer transition-colors"
            >
              Choose File
            </label>
            <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
              Supported formats: MP3, WAV, M4A (Max 100MB)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
