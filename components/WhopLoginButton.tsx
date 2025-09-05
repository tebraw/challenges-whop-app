// components/WhopLoginButton.tsx
'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';

interface WhopLoginButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function WhopLoginButton({ className, children }: WhopLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasWhopConfig, setHasWhopConfig] = useState(false);

  useEffect(() => {
    // Check if Whop is configured
    fetch('/api/auth/whop/status')
      .then(res => res.json())
      .then(data => setHasWhopConfig(data.configured))
      .catch(() => setHasWhopConfig(false));
  }, []);

  const handleLogin = () => {
    setIsLoading(true);
    if (hasWhopConfig) {
      // Redirect to Whop OAuth
      window.location.href = '/api/auth/whop/login?returnTo=' + encodeURIComponent(window.location.pathname);
    } else {
      // Fallback to dev login
      window.location.href = '/auth/whop';
    }
  };

  return (
    <Button
      onClick={handleLogin}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Verbindung...
        </div>
      ) : (
        children || 'Mit Whop anmelden'
      )}
    </Button>
  );
}
