import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-200 rounded-full animate-spin"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-indigo-600 rounded-full animate-spin"></div>
        </div>
        <div className="mt-4 text-lg text-gray-600">{message}</div>
      </div>
    </div>
  );
}
