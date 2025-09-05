// app/admin-login/page.tsx
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const [accessLevel, setAccessLevel] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const checkAccess = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/access-level');
      const data = await response.json();
      setAccessLevel(data.accessLevel);
      
      if (data.accessLevel.userType === 'company_owner') {
        setTimeout(() => {
          window.location.href = '/admin';
        }, 1000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-2xl mx-auto p-6">
        <Card className="p-8">
          <h1 className="text-2xl font-bold text-foreground mb-6">Admin Access Check</h1>
          
          <Button 
            onClick={checkAccess} 
            disabled={loading}
            className="w-full mb-4"
          >
            {loading ? 'Checking Access...' : 'Check Admin Access'}
          </Button>

          {accessLevel && (
            <div className="mb-4 p-4 bg-panel rounded-lg">
              <h3 className="font-semibold mb-2">Current Access Level:</h3>
              <pre className="text-sm text-foreground whitespace-pre-wrap">
                {JSON.stringify(accessLevel, null, 2)}
              </pre>
              
              {accessLevel.userType === 'company_owner' ? (
                <div className="mt-4">
                  <p className="text-green-600 font-semibold">✅ You have admin access!</p>
                  <Link href="/admin">
                    <Button className="mt-2">Go to Admin Dashboard</Button>
                  </Link>
                </div>
              ) : (
                <p className="text-red-600 font-semibold mt-4">❌ No admin access</p>
              )}
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
              <p className="text-red-700">Error: {error}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
