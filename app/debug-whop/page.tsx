// app/debug-whop/page.tsx - Debug page for Whop app issues
'use client';

import { useEffect, useState } from 'react';

interface DebugInfo {
  status: {
    healthy: boolean;
    error?: string;
    timestamp: string;
  };
  whopHeaders: Record<string, string | null>;
  envCheck: Record<string, boolean | string>;
  context: Record<string, boolean>;
  troubleshooting: {
    commonIssues: string[];
  };
}

export default function WhopDebugPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDebugInfo() {
      try {
        const response = await fetch('/api/debug/app-health');
        const data = await response.json();
        setDebugInfo(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch debug info');
      } finally {
        setLoading(false);
      }
    }

    fetchDebugInfo();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading diagnostic information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Debug Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isHealthy = debugInfo?.status.healthy ?? false;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Whop App Diagnostics
          </h1>
          <p className="text-gray-600">
            Diagnostic information for troubleshooting "Something went wrong" errors
          </p>
        </div>

        {/* Overall Health Status */}
        <div className={`mb-6 p-4 rounded-lg ${isHealthy ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'}`}>
          <div className="flex items-center">
            <div className={`text-2xl mr-3 ${isHealthy ? 'text-green-600' : 'text-red-600'}`}>
              {isHealthy ? '✅' : '❌'}
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${isHealthy ? 'text-green-800' : 'text-red-800'}`}>
                {isHealthy ? 'App is Healthy' : 'App has Issues'}
              </h2>
              <p className={`text-sm ${isHealthy ? 'text-green-700' : 'text-red-700'}`}>
                {debugInfo?.status.timestamp}
              </p>
            </div>
          </div>
        </div>

        {/* Common Issues */}
        {debugInfo?.troubleshooting.commonIssues && debugInfo.troubleshooting.commonIssues.length > 0 && (
          <div className="mb-6 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3">Common Issues Detected</h3>
            <ul className="space-y-2">
              {debugInfo.troubleshooting.commonIssues.map((issue, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-yellow-600 mr-2">⚠️</span>
                  <span className="text-yellow-700">{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Whop Headers */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Whop Headers</h3>
            <div className="space-y-2 text-sm">
              {debugInfo?.whopHeaders && Object.entries(debugInfo.whopHeaders).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="font-medium text-gray-600">{key}:</span>
                  <span className={`font-mono ${value ? 'text-green-600' : 'text-gray-400'}`}>
                    {value || 'Not set'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Environment Check */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Environment Check</h3>
            <div className="space-y-2 text-sm">
              {debugInfo?.envCheck && Object.entries(debugInfo.envCheck).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="font-medium text-gray-600">{key}:</span>
                  <span className={`${typeof value === 'boolean' ? (value ? 'text-green-600' : 'text-red-600') : 'text-blue-600'}`}>
                    {typeof value === 'boolean' ? (value ? '✅' : '❌') : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Context Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Context</h3>
            <div className="space-y-2 text-sm">
              {debugInfo?.context && Object.entries(debugInfo.context).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="font-medium text-gray-600">{key}:</span>
                  <span className={`${value ? 'text-green-600' : 'text-gray-400'}`}>
                    {value ? '✅' : '❌'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Troubleshooting Steps */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start">
                <span className="text-blue-600 mr-2">1.</span>
                <span>Check browser console for JavaScript errors (F12)</span>
              </div>
              <div className="flex items-start">
                <span className="text-blue-600 mr-2">2.</span>
                <span>Verify app is accessed through Whop iframe</span>
              </div>
              <div className="flex items-start">
                <span className="text-blue-600 mr-2">3.</span>
                <span>Try hard refresh (Ctrl+F5)</span>
              </div>
              <div className="flex items-start">
                <span className="text-blue-600 mr-2">4.</span>
                <span>Contact support if issues persist</span>
              </div>
            </div>
          </div>
        </div>

        {/* Raw Debug Data */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Raw Debug Data</h3>
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
