// components/AdminProtection.tsx
"use client";

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';

interface AdminProtectionProps {
  children: React.ReactNode;
  redirectPath?: string;
}

export default function AdminProtection({ children, redirectPath = '/discover' }: AdminProtectionProps) {
  const { user, loading: authLoading, isAdmin } = useAuth();

  // 🔒 SECURITY: Redirect non-admin users
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      window.location.href = redirectPath;
      return;
    }
  }, [user, authLoading, isAdmin, redirectPath]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Show access denied for non-admin users
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">🔒 Admin Access Required</h1>
            <p className="text-gray-600 mb-6">
              Only company owners can access admin features. Community members can participate in challenges and browse content.
            </p>
          </div>
          <div className="space-y-3">
            <Button 
              onClick={() => window.location.href = '/discover'}
              className="w-full"
            >
              🔍 Browse Challenges
            </Button>
            <Button 
              onClick={() => window.location.href = '/feed'}
              variant="outline"
              className="w-full"
            >
              📱 View Feed
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render children only for admin users
  return <>{children}</>;
}
