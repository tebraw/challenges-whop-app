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
          console.log('❌ Access denied - User needs subscription!');
          console.log('❌ Role:', user.role, 'Company ID:', user.whopCompanyId);
          
          // REDIRECT TO PLAN SELECTION: User needs to purchase subscription
          console.log('🔄 Redirecting to plan selection for company owner...');
          router.push('/plans?reason=no_subscription');
          return;
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
    // Show loading while redirect happens
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-brand border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Redirecting to plan selection...</p>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
