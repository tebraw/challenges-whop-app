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
      
      // Also check current page context
      const pageContext = {
        url: window.location.href,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        isInIframe: window !== window.top,
        parentOrigin: window !== window.top ? document.referrer : 'not-in-iframe'
      };
      
      setDebugInfo({ 
        headerTest: data, 
        pageContext,
        analysis: {
          isWhopDomain: window.location.href.includes('whop.com'),
          hasWhopReferrer: document.referrer.includes('whop.com'),
          inIframe: window !== window.top,
          directAccess: !document.referrer.includes('whop.com')
        }
      });
    } catch (error) {
      setDebugInfo({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
    setLoading(false);
  };

  const runWhopDetection = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/whop-detection');
      const data = await response.json();
      setDebugInfo({ detection: data, status: response.status });
    } catch (error) {
      setDebugInfo({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
    setLoading(false);
  };

  const testExperienceAuth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/experience-test');
      const data = await response.json();
      setDebugInfo({ experienceTest: data, status: response.status });
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
        <Button onClick={runWhopDetection} disabled={loading}>
          🔍 Auto-Diagnose
        </Button>
        <Button onClick={checkWhopHeaders} disabled={loading}>
          Check Whop Headers
        </Button>
        <Button onClick={testExperienceAuth} disabled={loading}>
          Test Experience Auth
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
        <h3 className="font-semibold mb-2">🔧 Experience App Debug:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li><strong>Check Whop Headers:</strong> Alle verfügbaren Whop headers anzeigen</li>
          <li><strong>Test Experience Auth:</strong> Experience App Context und User prüfen</li>
          <li><strong>Test Current User:</strong> Aktuellen User Status abrufen</li>
          <li><strong>Try Whop Login:</strong> OAuth Login versuchen (falls nicht in iFrame)</li>
        </ol>
        
        <div className="mt-3 p-2 bg-blue-100 rounded">
          <strong>💡 Experience App Hinweise:</strong>
          <ul className="text-xs mt-1 space-y-1">
            <li>• App muss in Whop Company installiert und über Whop aufgerufen werden</li>
            <li>• Experience Apps laufen in iFrame mit automatischen Headers</li>
            <li>• Direkte URL-Aufrufe funktionieren nicht mit Experience Apps</li>
          </ul>
        </div>
        
        <div className="mt-3 p-2 bg-orange-100 rounded">
          <strong>🔧 Kein Login? Versuche:</strong>
          <ul className="text-xs mt-1 space-y-1">
            <li>• <strong>Experience URL:</strong> whop.com/company/[COMPANY]/experiences/[APP]</li>
            <li>• <strong>OAuth Login:</strong> Klicke "Try Whop Login" unten</li>
            <li>• <strong>Developer Portal:</strong> Prüfe App Installation</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
