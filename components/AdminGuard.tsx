// components/AdminGuard.tsx - Admin Route Protection with Subscription Check
"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';

interface AdminGuardProps {
  children: React.ReactNode;
}

interface OnboardingStatus {
  isCompanyOwner: boolean;
  hasActiveSubscription: boolean;
  needsOnboarding: boolean;
  currentPlan?: any;
  user?: any;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkAdminAccess() {
      try {
        console.log('🔍 Checking admin access and subscription status...');
        
        // Check onboarding status (includes company owner and subscription checks)
        const onboardingResponse = await fetch('/api/auth/onboarding-status');
        
        if (!onboardingResponse.ok) {
          console.log('❌ Onboarding status check failed');
          return;
        }
        
        const onboardingData = await onboardingResponse.json();
        console.log('📊 Onboarding status:', onboardingData);
        setOnboardingStatus(onboardingData);
        
        // Flow decision:
        if (!onboardingData.isCompanyOwner) {
          // Not a company owner - deny access
          console.log('❌ Not a company owner - access denied');
          setHasAccess(false);
        } else if (onboardingData.needsOnboarding) {
          // Company owner but needs subscription - redirect to onboarding
          console.log('🚀 Company owner needs onboarding - redirecting...');
          router.push('/onboarding');
          return;
        } else if (onboardingData.hasActiveSubscription) {
          // Company owner with active subscription - grant access
          console.log('✅ Company owner with active subscription - access granted');
          setHasAccess(true);
        } else {
          // Something went wrong
          console.log('❓ Unexpected onboarding state:', onboardingData);
          setHasAccess(false);
        }
        
      } catch (error: any) {
        console.error('❌ Admin access check failed:', error);
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
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Checking access permissions...</p>
        </Card>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-500">
            🚫 Access Denied
          </h1>
          
          {onboardingStatus?.isCompanyOwner === false ? (
            <div>
              <p className="text-gray-600 mb-6">
                Only company owners can access the admin dashboard.
              </p>
              <button
                onClick={() => router.push('/discover')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                Go to Public Challenges
              </button>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-6">
                You need an active subscription to access the admin dashboard.
              </p>
              <button
                onClick={() => router.push('/onboarding')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                Choose Your Plan
              </button>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // User has access - render admin content
  return <>{children}</>;
}
