'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function WhopLoginTest() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkWhopHeaders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/whop-headers');
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      setDebugInfo({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
    setLoading(false);
  };

  const testCurrentUser = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/user');
      const data = await response.json();
      setDebugInfo({ userTest: data, status: response.status });
    } catch (error) {
      setDebugInfo({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
    setLoading(false);
  };

  const tryWhopLogin = () => {
    window.location.href = '/api/auth/whop/login';
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold">🔍 Whop Login Debug Test</h1>
      
      <div className="flex gap-2 flex-wrap">
        <Button onClick={checkWhopHeaders} disabled={loading}>
          Check Whop Headers
        </Button>
        <Button onClick={testCurrentUser} disabled={loading}>
          Test Current User
        </Button>
        <Button onClick={tryWhopLogin} disabled={loading}>
          Try Whop Login
        </Button>
      </div>

      {debugInfo && (
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </Card>
      )}
      
      <Card className="p-4 bg-blue-50">
        <h3 className="font-semibold mb-2">🔧 Debug Schritte:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li><strong>Check Whop Headers:</strong> Sieht welche Whop headers ankommen</li>
          <li><strong>Test Current User:</strong> Prüft ob ein User erkannt wird</li>
          <li><strong>Try Whop Login:</strong> Versucht OAuth Login (falls App nicht in iFrame)</li>
        </ol>
      </Card>
    </div>
  );
}
