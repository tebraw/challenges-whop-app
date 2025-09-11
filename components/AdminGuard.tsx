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
        console.log('Starting Whop admin access check...');
        
        // First check experience context and auth status
        const contextResponse = await fetch('/api/auth/experience-context', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include'
        });
        
        if (!contextResponse.ok) {
          throw new Error(`Experience context API failed: ${contextResponse.status} ${contextResponse.statusText}`);
        }
        
        const contextData = await contextResponse.json();
        
        console.log('Experience context:', contextData);
        
        // Check if there's an error in the response
        if (contextData.error) {
          console.log('Experience context error - trying admin API directly:', contextData.error);
          // Don't throw immediately, try admin API first
        }
        
        // 🎯 FLEXIBLE AUTH: Try admin API even if experience context has issues
        // This handles cases where user is authenticated in Whop but our context detection fails
        
        if (!contextData.isAuthenticated && !contextData.userId) {
          console.log('No authentication detected - redirecting to Whop login');
          window.location.href = '/auth/whop';
          return;
        }
        
        // Skip role check if we have userId but role mapping failed
        const shouldSkipRoleCheck = contextData.userId && contextData.userRole === 'guest';
        
        if (!shouldSkipRoleCheck && contextData.userRole !== 'ersteller') {
          console.log('Not admin role - trying admin API anyway');
          // Don't redirect immediately, try admin API first
        }
        
        // User is authenticated and has admin role - now test admin API access
        const adminResponse = await fetch('/api/admin/challenges', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include'
        });
        console.log('Admin challenges API response status:', adminResponse.status);
        
        if (adminResponse.ok) {
          console.log('Admin access granted!');
          setIsAdmin(true);
          
          const data = await adminResponse.json();
          setDebugInfo({ 
            success: true, 
            experienceContext: contextData,
            challengeCount: data.challenges?.length || 0
          });
        } else {
          const errorData = await adminResponse.json().catch(() => ({ error: 'Unknown error' }));
          console.log('Admin API access denied:', errorData);
          
          // Check if this is just an auth issue that can be resolved
          if (adminResponse.status === 401 && !contextData.isAuthenticated) {
            console.log('Authentication required - redirecting to Whop login');
            window.location.href = '/auth/whop';
            return;
          }
          
          if (adminResponse.status === 403 && contextData.userRole !== 'ersteller') {
            console.log('Admin role required - redirecting to plans');
            router.push('/plans?reason=admin_access_required');
            return;
          }
          
          setDebugInfo({ 
            success: false, 
            error: errorData.error,
            debug: errorData.debug,
            status: adminResponse.status,
            experienceContext: contextData,
            headers: errorData.headers
          });
        }
      } catch (error: any) {
        console.error('Experience context error:', error);
        setDebugInfo({ 
          error: error?.message || 'Network error', 
          networkError: true,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent.substring(0, 50) + '...'
        });
      } finally {
        setIsChecking(false);
      }
    }

    checkAdminAccess();
  }, [router]);

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
        <Card className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-brand border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Access verification in progress...</p>
          
          {debugInfo && (
            <div className="mt-4 p-4 bg-gray-100 rounded text-left text-sm">
              <h3 className="font-bold mb-2">Debug Information:</h3>
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
