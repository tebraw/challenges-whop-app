'use client';

import { useEffect } from 'react';

export function useConsoleErrorSuppression() {
  useEffect(() => {
    // Additional client-side error suppression for Whop integration
    const handleWindowError = (event: ErrorEvent) => {
      const message = event.message || '';
      
      // Suppress Whop-related cross-origin errors
      if (
        message.includes('postMessage') ||
        message.includes('whop.com') ||
        message.includes('dash.whop.com') ||
        message.includes('localhost:8003') ||
        message.includes('cross-origin')
      ) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.toString() || '';
      
      // Suppress Whop API-related promise rejections that are handled elsewhere
      if (
        reason.includes('whop.com') ||
        reason.includes('postMessage') ||
        reason.includes('cross-origin')
      ) {
        event.preventDefault();
        return false;
      }
    };

    // Only add listeners in production or when specifically needed
    if (process.env.NODE_ENV === 'production' || window.location.hostname.includes('whop.com')) {
      window.addEventListener('error', handleWindowError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);

      return () => {
        window.removeEventListener('error', handleWindowError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
    }
  }, []);
}

export default useConsoleErrorSuppression;
