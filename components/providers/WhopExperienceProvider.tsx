"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

// 🎯 WHOP RULE #2: Rollen sauber mappen
type WhopRole = 'admin' | 'customer' | 'no_access';
type AppRole = 'ersteller' | 'member' | 'guest';

interface ExperienceContext {
  userId?: string;
  experienceId?: string;
  companyId?: string;
  userRole: AppRole;
  whopRole: WhopRole;
  permissions: {
    canCreate: boolean;
    canManage: boolean;
    canParticipate: boolean;
    canViewAnalytics: boolean;
  };
  isLoading: boolean;
  error?: string;
}

const ExperienceContext = createContext<ExperienceContext | null>(null);

// Calculate permissions based on role
function calculatePermissions(role: AppRole) {
  switch (role) {
    case 'ersteller':
      return {
        canCreate: true,
        canManage: true,
        canParticipate: true,
        canViewAnalytics: true
      };
    case 'member':
      return {
        canCreate: false,
        canManage: false,
        canParticipate: true,
        canViewAnalytics: false
      };
    case 'guest':
    default:
      return {
        canCreate: false,
        canManage: false,
        canParticipate: false,
        canViewAnalytics: false
      };
  }
}

// 🎯 WHOP RULE #4: UI darf rendern, Logik bleibt Server
export function WhopExperienceProvider({ children }: { children: React.ReactNode }) {
  const [context, setContext] = useState<ExperienceContext>({
    userRole: 'guest',
    whopRole: 'no_access',
    permissions: calculatePermissions('guest'),
    isLoading: true
  });

  useEffect(() => {
    // 🎯 WHOP RULE #3: Server-side auth check
    async function loadExperienceContext() {
      try {
        const response = await fetch('/api/auth/experience-context', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setContext({
            ...data,
            permissions: calculatePermissions(data.userRole || 'guest'),
            isLoading: false,
            error: undefined
          });
        } else {
          // Handle auth errors gracefully
          console.warn('Experience context fetch failed:', response.status);
          setContext(prev => ({
            ...prev,
            isLoading: false,
            error: `Auth failed: ${response.status}`
          }));
        }
      } catch (error) {
        console.error('Experience context error:', error);
        // Fail gracefully - still allow the app to load
        setContext(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    }

    // Only load context in browser environment
    if (typeof window !== 'undefined') {
      loadExperienceContext();
    } else {
      // Server-side: Set loading to false to prevent hydration mismatch
      setContext(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  return (
    <ExperienceContext.Provider value={context}>
      {children}
    </ExperienceContext.Provider>
  );
}

export function useExperienceContext() {
  const context = useContext(ExperienceContext);
  if (!context) {
    // Return safe default instead of throwing error
    return {
      userRole: 'guest' as AppRole,
      whopRole: 'no_access' as WhopRole,
      permissions: calculatePermissions('guest'),
      isLoading: false,
      error: 'No experience context available'
    };
  }
  return context;
}

// Helper hooks for specific permissions
export function useCanCreate() {
  const { permissions } = useExperienceContext();
  return permissions.canCreate;
}

export function useCanManage() {
  const { permissions } = useExperienceContext();
  return permissions.canManage;
}

export function useCanParticipate() {
  const { permissions } = useExperienceContext();
  return permissions.canParticipate;
}
