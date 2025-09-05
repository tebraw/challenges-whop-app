// app/test-admin/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export default function TestAdminPage() {
  const [accessLevel, setAccessLevel] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [adminGuardResult, setAdminGuardResult] = useState<string>('');

  const checkAccess = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/access-level?t=' + Date.now());
      const data = await response.json();
      setAccessLevel(data.accessLevel);
    } catch (error) {
      console.error('Error checking access:', error);
    } finally {
      setLoading(false);
    }
  };

  const testAdminAccess = async () => {
    setLoading(true);
    try {
      const response = await fetch('/admin?test=1');
      if (response.ok) {
        setAdminGuardResult('✅ Admin access successful!');
      } else if (response.redirected) {
        setAdminGuardResult('🔄 Redirected to: ' + response.url);
      } else {
        setAdminGuardResult('❌ Access denied: ' + response.status);
      }
    } catch (error) {
      setAdminGuardResult('❌ Error: ' + error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAccess();
  }, []);

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8">
          <h1 className="text-2xl font-bold text-foreground mb-6">Complete Admin Access Test</h1>
          
          <div className="space-y-6">
            {/* Access Level Check */}
            <div>
              <h2 className="text-lg font-semibold mb-2">1. Current Access Level</h2>
              <Button 
                onClick={checkAccess} 
                disabled={loading}
                className="mb-4"
              >
                {loading ? 'Checking...' : 'Refresh Access Level'}
              </Button>
              
              {accessLevel && (
                <div className="p-4 bg-panel rounded-lg">
                  <pre className="text-sm text-foreground whitespace-pre-wrap">
                    {JSON.stringify(accessLevel, null, 2)}
                  </pre>
                  
                  <div className="mt-4">
                    {accessLevel.userType === 'company_owner' ? (
                      <div className="text-green-600 font-semibold">✅ Company Owner Access Detected!</div>
                    ) : accessLevel.userType === 'customer' ? (
                      <div className="text-yellow-600 font-semibold">👤 Customer Access</div>
                    ) : (
                      <div className="text-red-600 font-semibold">🚫 Guest Access Only</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Admin Route Test */}
            <div>
              <h2 className="text-lg font-semibold mb-2">2. Test Admin Route Access</h2>
              <Button 
                onClick={testAdminAccess} 
                disabled={loading}
                className="mb-4"
              >
                {loading ? 'Testing...' : 'Test /admin Route'}
              </Button>
              
              {adminGuardResult && (
                <div className="p-4 bg-panel rounded-lg">
                  <p className="text-sm text-foreground">{adminGuardResult}</p>
                </div>
              )}
            </div>

            {/* Direct Links */}
            <div>
              <h2 className="text-lg font-semibold mb-2">3. Direct Access Links</h2>
              <div className="space-y-2">
                <div>
                  <Link href="/admin" className="text-blue-600 hover:underline">
                    → Go to Admin Dashboard (/admin)
                  </Link>
                </div>
                <div>
                  <Link href="/admin-direct" className="text-blue-600 hover:underline">
                    → Go to Direct Admin (/admin-direct) - Bypass Guard
                  </Link>
                </div>
                <div>
                  <Link href="/admin/new" className="text-blue-600 hover:underline">
                    → Create New Challenge (/admin/new)
                  </Link>
                </div>
              </div>
            </div>

            {/* Expected Flow */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold mb-2">Expected Flow for Company Owner:</h2>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted">
                <li>User clicks "Open Admin Dashboard" in Whop iframe</li>
                <li>System detects user as company_owner (ADMIN + whopCompanyId)</li>
                <li>AdminGuard allows access to /admin route</li>
                <li>User sees admin dashboard with list of challenges</li>
                <li>User can click "Create Challenge" to go to /admin/new</li>
              </ol>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
