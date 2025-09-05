"use client";
import { useEffect, useState } from 'react';

interface AdminOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      try {
        const response = await fetch('/api/auth/check-admin');
        const data = await response.json();
        setIsAdmin(data.isAdmin);
      } catch (error) {
        console.error('Admin check failed:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAdmin();
  }, []);

  if (isLoading) {
    return <>{fallback}</>;
  }

  return isAdmin ? <>{children}</> : <>{fallback}</>;
}
