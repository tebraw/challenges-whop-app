// components/AdminGuard.tsx - Admin Route Protection
"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { getUserAccessLevel } from '@/lib/access-control-client';

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkAdminAccess() {
      try {
        const accessLevel = await getUserAccessLevel();
        
        if (accessLevel.userType === 'company_owner') {
          setIsAdmin(true);
        } else {
          // Redirect to home with error message
          router.push('/?error=admin-access-required');
        }
      } catch (error) {
        console.error('Admin check failed:', error);
        router.push('/?error=auth-error');
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
          <h1 className="text-2xl font-bold mb-4 text-red-500">Access Denied</h1>
          <p className="text-muted mb-4">
            You need administrator privileges to access this area.
          </p>
          <button 
            onClick={() => router.push('/')}
            className="bg-brand text-black px-4 py-2 rounded hover:bg-brand/90"
          >
            Return to Home
          </button>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
