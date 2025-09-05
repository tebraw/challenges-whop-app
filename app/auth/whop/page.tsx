'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

export default function WhopLoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleWhopLogin = () => {
    setIsLoading(true);
    // Redirect to Whop OAuth login (GET request)
    window.location.href = '/api/auth/whop/login?returnTo=/admin';
  };

  const handleDevLogin = async () => {
    setIsLoading(true);
    try {
      // Use POST to trigger session creation, then redirect
      const response = await fetch('/api/auth/dev-admin', { 
        method: 'POST',
        redirect: 'manual' // Don't follow redirects automatically
      });
      
      if (response.status === 307 || response.status === 308) {
        // Manual redirect to follow server redirect
        window.location.href = '/admin';
      } else if (response.ok) {
        window.location.href = '/admin';
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      setIsLoading(false);
      alert('Dev login failed: ' + (error as Error).message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Login mit deinem Whop Konto
          </p>
        </div>
        
        <div className="space-y-4">
          {/* Whop Login */}
          <Button
            onClick={handleWhopLogin}
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Verbinde mit Whop...
              </div>
            ) : (
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm0 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10z"/>
                  <path d="M8 12h8v2H8z"/>
                </svg>
                Mit Whop anmelden
              </div>
            )}
          </Button>

          {/* Development Login */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500">Development</span>
            </div>
          </div>

          <Button
            onClick={handleDevLogin}
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Dev Admin Login (Testing)
          </Button>

          <div className="text-xs text-center text-gray-500 dark:text-gray-400 space-y-1">
            <p>🔹 <strong>Whop Login:</strong> Für echte Whop Produkte</p>
            <p>🔹 <strong>Dev Login:</strong> Für Testing ohne Whop Account</p>
          </div>
        </div>
      </div>
    </div>
  );
}
