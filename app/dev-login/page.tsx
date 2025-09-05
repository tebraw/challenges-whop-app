// app/dev-login/page.tsx
"use client";

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function DevLoginPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleDevLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/dev-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setResult('✅ Development admin login successful!');
        // Redirect to admin after a short delay
        setTimeout(() => {
          window.location.href = '/admin';
        }, 1000);
      } else {
        const error = await response.text();
        setResult(`❌ Error: ${error}`);
      }
    } catch (error) {
      setResult(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/access-level');
      const data = await response.json();
      setResult(`Current access level: ${JSON.stringify(data.accessLevel, null, 2)}`);
    } catch (error) {
      setResult(`❌ Error checking auth: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-2xl mx-auto p-6">
        <Card className="p-8">
          <h1 className="text-2xl font-bold text-foreground mb-6">Development Login</h1>
          
          <div className="space-y-4">
            <Button 
              onClick={handleDevLogin} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Setting up...' : 'Login as Development Admin'}
            </Button>

            <Button 
              onClick={checkAuth} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? 'Checking...' : 'Check Current Access Level'}
            </Button>
          </div>

          {result && (
            <div className="mt-6 p-4 bg-panel rounded-lg">
              <pre className="text-sm text-foreground whitespace-pre-wrap">
                {result}
              </pre>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
