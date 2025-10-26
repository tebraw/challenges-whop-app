"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface SmartCheckResult {
  hasAccess?: boolean;
  userRole?: string;
  isCompanyOwner?: boolean;
  needsSubscription?: boolean;
  needsAuth?: boolean;
  action?: string;
  message?: string;
  upgraded?: boolean;
}

export default function AdminSmartCheck() {
  const [checking, setChecking] = useState(true);
  const [result, setResult] = useState<SmartCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    performSmartCheck();
  }, []);

  const performSmartCheck = async () => {
    try {
      setChecking(true);
      setError(null);
      
      console.log('🧠 Performing smart access check...');
      
      const response = await fetch('/api/auth/smart-check', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      console.log('📋 Smart check result:', data);
      
      setResult(data);
      
      // Handle different scenarios
      if (data.hasAccess) {
        console.log('✅ Access granted - redirecting to admin dashboard');
        router.push('/admin');
        return;
      }
      
      if (data.needsAuth) {
        console.log('🔐 Authentication required');
        window.location.href = '/auth/whop';
        return;
      }
      
      if (data.needsSubscription) {
        console.log('💳 Subscription required');
        const url = new URL('/plans', window.location.origin);
        url.searchParams.set('reason', 'subscription_required');
        url.searchParams.set('user_type', 'company_owner');
        router.push(url.toString());
        return;
      }
      
      if (data.action === 'install_app') {
        console.log('📱 App installation required');
        // Show instructions for app installation
      }
      
    } catch (error) {
      console.error('❌ Smart check failed:', error);
      setError(error instanceof Error ? error.message : 'Check failed');
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="bg-gray-800 border-gray-700 p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Checking Access...</h2>
          <p className="text-gray-400">Verifying your permissions and subscription status</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="bg-gray-800 border-gray-700 p-8 text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-white mb-2">Access Check Failed</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button 
            onClick={performSmartCheck}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  if (result && !result.hasAccess) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="bg-gray-800 border-gray-700 p-8 text-center max-w-md">
          <div className="text-yellow-500 text-5xl mb-4">
            {result.needsSubscription ? '💳' : 
             result.needsAuth ? '🔐' : 
             result.action === 'install_app' ? '📱' : '❓'}
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            {result.needsSubscription ? 'Subscription Required' :
             result.needsAuth ? 'Authentication Required' :
             result.action === 'install_app' ? 'App Installation Required' :
             'Access Check'}
          </h2>
          <p className="text-gray-400 mb-4">{result.message}</p>
          
          {result.needsSubscription && (
            <Button 
              onClick={() => router.push('/plans?reason=admin_access')}
              className="bg-green-600 hover:bg-green-700"
            >
              View Plans
            </Button>
          )}
          
          {result.needsAuth && (
            <Button 
              onClick={() => window.location.href = '/auth/whop'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Login with Whop
            </Button>
          )}
          
          {result.action === 'install_app' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Install the app through Whop to get company ownership
              </p>
              <Button 
                onClick={() => window.open('https://whop.com/challenges-app', '_blank')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Install App
              </Button>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // Should not reach here, but just in case
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <Card className="bg-gray-800 border-gray-700 p-8 text-center">
        <div className="text-blue-500 text-5xl mb-4">🔄</div>
        <h2 className="text-xl font-semibold text-white mb-2">Redirecting...</h2>
        <p className="text-gray-400">Taking you to the admin dashboard</p>
      </Card>
    </div>
  );
}
