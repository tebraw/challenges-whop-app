// hooks/useAuth.ts
"use client";

import { useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'USER';
  whopCompanyId: string | null;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  error: string | null;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    isAdmin: false,
    error: null
  });

  useEffect(() => {
    async function checkAuth() {
      try {
        // Check current user
        const userRes = await fetch('/api/auth/me', {
          cache: 'no-store'
        });
        
        if (!userRes.ok) {
          setState({
            user: null,
            loading: false,
            isAdmin: false,
            error: 'Not authenticated'
          });
          return;
        }

        const userData = await userRes.json();
        
        // Check access level
        const accessRes = await fetch('/api/auth/access-level', {
          cache: 'no-store'
        });
        
        let isAdmin = false;
        if (accessRes.ok) {
          const accessData = await accessRes.json();
          isAdmin = accessData.isAdmin || accessData.accessLevel === 'admin';
        }

        setState({
          user: userData.user,
          loading: false,
          isAdmin,
          error: null
        });

      } catch (error) {
        console.error('Auth check failed:', error);
        setState({
          user: null,
          loading: false,
          isAdmin: false,
          error: 'Authentication failed'
        });
      }
    }

    checkAuth();
  }, []);

  return state;
}
