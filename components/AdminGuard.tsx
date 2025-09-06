// components/AdminGuard.tsx - Admin Route Protection
"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkAdminAccess() {
      try {
        console.log('🔍 Starting admin access check...');
        
        // Get debug information first
        const debugResponse = await fetch('/api/debug/user');
        const debugData = await debugResponse.json();
        console.log('🔍 Debug data:', debugData);
        setDebugInfo(debugData);
        
        // Check user authentication status
        const response = await fetch('/api/auth/me');
        console.log('🔍 Auth me response status:', response.status);
        
        if (!response.ok) {
          console.log('❌ Auth me failed:', response.status);
          setDebugInfo((prev: any) => ({ ...prev, authMeError: `Status: ${response.status}` }));
          return;
        }
        
        const user = await response.json();
        console.log('👤 User from /api/auth/me:', user);
        setDebugInfo((prev: any) => ({ ...prev, authMeUser: user }));
        
        // Check if user is admin (has role ADMIN and whopCompanyId)
        if (user.role === 'ADMIN' && user.whopCompanyId) {
          console.log('✅ Admin access granted!');
          setIsAdmin(true);
        } else {
          console.log('❌ Access denied - User:', user);
          console.log('❌ Role:', user.role, 'Company ID:', user.whopCompanyId);
          setDebugInfo((prev: any) => ({ 
            ...prev, 
            accessDeniedReason: {
              role: user.role,
              whopCompanyId: user.whopCompanyId,
              hasRole: user.role === 'ADMIN',
              hasCompanyId: !!user.whopCompanyId
            }
          }));
        }
      } catch (error: any) {
        console.error('❌ Admin check failed:', error);
        setDebugInfo((prev: any) => ({ ...prev, error: error?.message || 'Unknown error' }));
      } finally {
        setIsChecking(false);
      }
    }

    checkAdminAccess();
  }, []);

  if (isChecking) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-brand border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Checking admin access...</p>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8">
          <h1 className="text-2xl font-bold mb-4 text-red-500">🚫 No Privilege for This Area</h1>
          <p className="text-muted mb-4">
            You need Company Owner privileges to access the admin dashboard.
          </p>
          
          <div className="mt-6 p-4 bg-gray-100 rounded text-sm">
            <h3 className="font-bold mb-2">Debug Information:</h3>
            <div className="space-y-2">
              <p><strong>Debug Info Available:</strong> {debugInfo ? 'Yes' : 'No'}</p>
              {debugInfo?.error && (
                <p className="text-red-600"><strong>Error:</strong> {debugInfo.error}</p>
              )}
              {debugInfo?.authMeError && (
                <p className="text-red-600"><strong>Auth Me Error:</strong> {debugInfo.authMeError}</p>
              )}
              {debugInfo?.authMeUser && (
                <div>
                  <p><strong>User Role:</strong> {debugInfo.authMeUser.role}</p>
                  <p><strong>Company ID:</strong> {debugInfo.authMeUser.whopCompanyId || 'None'}</p>
                  <p><strong>User ID:</strong> {debugInfo.authMeUser.id}</p>
                </div>
              )}
              {debugInfo?.accessDeniedReason && (
                <div className="text-red-600">
                  <p><strong>Access Denied Because:</strong></p>
                  <p>- Has ADMIN role: {debugInfo.accessDeniedReason.hasRole ? 'Yes' : 'No'}</p>
                  <p>- Has Company ID: {debugInfo.accessDeniedReason.hasCompanyId ? 'Yes' : 'No'}</p>
                </div>
              )}
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer font-medium">Raw Debug Data</summary>
              <pre className="whitespace-pre-wrap overflow-auto text-xs mt-2 bg-white p-2 rounded">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          </div>
          
          <div className="mt-6 flex gap-2">
            <a 
              href="/dev-login" 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Try Dev Login
            </a>
            <a 
              href="/api/debug/user" 
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              View Raw Debug
            </a>
            <button 
              onClick={() => window.location.reload()}
              className="bg-brand text-black px-4 py-2 rounded hover:bg-brand/90"
            >
              Retry
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
