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
        console.log('Starting Whop experience admin access check...');
        
        // Test the admin challenges API directly - it has the proper Whop auth
        const adminResponse = await fetch('/api/admin/challenges');
        console.log('Admin challenges API response status:', adminResponse.status);
        
        if (adminResponse.ok) {
          console.log('Admin access granted via Whop experience auth!');
          setIsAdmin(true);
          
          // Get additional debug info
          const data = await adminResponse.json();
          setDebugInfo({ 
            success: true, 
            experienceContext: data.experienceContext,
            challengeCount: data.challenges?.length || 0
          });
        } else {
          const errorData = await adminResponse.json().catch(() => ({ error: 'Unknown error' }));
          console.log('Admin access denied:', errorData);
          setDebugInfo({ 
            success: false, 
            error: errorData.error,
            debug: errorData.debug,
            status: adminResponse.status
          });

          // Check specific error types
          if (adminResponse.status === 401) {
            console.log('Authentication required - redirecting to Whop login');
            window.location.href = '/auth/whop';
            return;
          } else if (adminResponse.status === 403) {
            console.log('Access denied - redirecting to plans');
            router.push('/plans?reason=admin_access_required');
            return;
          }
        }
      } catch (error: any) {
        console.error('Admin check failed:', error);
        setDebugInfo({ error: error?.message || 'Network error', networkError: true });
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
