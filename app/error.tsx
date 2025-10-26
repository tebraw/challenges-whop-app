// app/error.tsx - Global error boundary for Whop app
'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('🚨 Global Error Boundary:', error);
    
    // Send error to monitoring service if needed
    // reportError(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
            <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h2 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            Something went wrong
          </h2>
          
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            We encountered an unexpected error. Please try refreshing the page.
          </p>
          
          <div className="mt-6 flex flex-col space-y-3">
            <button
              onClick={reset}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try again
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Refresh page
            </button>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left">
              <summary className="text-sm text-gray-500 cursor-pointer">Error Details (Development)</summary>
              <pre className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-auto">
                {error.message}
                {error.stack && '\n\nStack trace:\n' + error.stack}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
