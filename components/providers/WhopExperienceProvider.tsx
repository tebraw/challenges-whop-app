"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { WhopApp } from "@whop/react/components";

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
}

const ExperienceContext = createContext<ExperienceContext | null>(null);

// 🎯 WHOP RULE #4: UI darf rendern, Logik bleibt Server
export function WhopExperienceProvider({ children }: { children: React.ReactNode }) {
  const [context, setContext] = useState<ExperienceContext>({
    userRole: 'guest',
    whopRole: 'no_access',
    permissions: {
      canCreate: false,
      canManage: false,
      canParticipate: false,
      canViewAnalytics: false
    },
    isLoading: true
  });

  useEffect(() => {
    // 🎯 WHOP RULE #3: Server-side auth check
    async function loadExperienceContext() {
      try {
        const response = await fetch('/api/auth/experience-context');
        if (response.ok) {
          const data = await response.json();
          setContext({
            ...data,
            permissions: calculatePermissions(data.userRole),
            isLoading: false
          });
        } else {
          // Fallback to guest
          setContext(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Failed to load experience context:', error);
        setContext(prev => ({ ...prev, isLoading: false }));
      }
    }

    loadExperienceContext();
  }, []);

  return (
    <WhopApp>
      <ExperienceContext.Provider value={context}>
        {children}
      </ExperienceContext.Provider>
    </WhopApp>
  );
}

export function useExperienceContext() {
  const context = useContext(ExperienceContext);
  if (!context) {
    throw new Error('useExperienceContext must be used within WhopExperienceProvider');
  }
  return context;
}

// 🎯 WHOP RULE #10: Sichtbare Rollen in deiner App
function calculatePermissions(appRole: AppRole) {
  switch (appRole) {
    case 'ersteller':
      return {
        canCreate: true,        // darf konfigurieren, moderieren, veröffentlichen
        canManage: true,        // Payouts anstoßen usw.
        canParticipate: true,   // kann auch teilnehmen
        canViewAnalytics: true  // Revenue, Statistics
      };
    case 'member':
      return {
        canCreate: false,       
        canManage: false,       
        canParticipate: true,   // darf konsumieren/teilnehmen
        canViewAnalytics: false 
      };
    case 'guest':
    default:
      return {
        canCreate: false,       
        canManage: false,       
        canParticipate: false,  // nur Public/Lite-Ansichten
        canViewAnalytics: false 
      };
  }
}
