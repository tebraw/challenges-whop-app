// components/WhopErrorHandler.tsx
"use client";

import { useEffect } from 'react';

export default function WhopErrorHandler() {
  useEffect(() => {
    // Suppress known Whop postMessage errors to keep console clean
    const originalError = window.console.error;
    
    window.console.error = (...args) => {
      const message = args[0]?.toString() || '';
      
      // Filter out known Whop postMessage errors
      if (
        message.includes("Failed to execute 'postMessage'") &&
        (message.includes('whop.com') || message.includes('dash.whop.com') || message.includes('localhost:8003'))
      ) {
        // These are harmless cross-origin communication attempts from Whop
        // Don't log them to keep console clean
        return;
      }
      
      // Log all other errors normally
      originalError.apply(console, args);
    };
    
    // Cleanup
    return () => {
      window.console.error = originalError;
    };
  }, []);

  return null; // This component renders nothing
}