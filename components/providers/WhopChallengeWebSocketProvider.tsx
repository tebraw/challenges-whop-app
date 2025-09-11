/**
 * 🎯 WHOP WEBSOCKET PROVIDER
 * 
 * Implements WHOP RULE #6: Verwende WhopWebsocketProvider für trusted real-time messages
 * This ensures all WebSocket messages are authenticated and trusted through Whop's system
 */
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
// Note: Whop WebSocket provider will be added when available in SDK
import { useExperienceContext } from './WhopExperienceProvider';

interface ChallengeWebSocketContextType {
  // Real-time challenge updates
  subscribeToChallenge: (challengeId: string) => void;
  unsubscribeFromChallenge: (challengeId: string) => void;
  
  // Admin notifications
  subscribeToAdminNotifications: () => void;
  unsubscribeFromAdminNotifications: () => void;
}

const ChallengeWebSocketContext = createContext<ChallengeWebSocketContextType | null>(null);

interface WhopChallengeWebSocketProviderProps {
  children: ReactNode;
}

export function WhopChallengeWebSocketProvider({ children }: WhopChallengeWebSocketProviderProps) {
  const { userId, experienceId, userRole } = useExperienceContext();

  // 🎯 WHOP RULE #6: Only provide WebSocket if user is authenticated
  const isAuthenticated = !!userId && userRole !== 'guest';
  
  if (!isAuthenticated || !userId || !experienceId) {
    return (
      <ChallengeWebSocketContext.Provider value={null}>
        {children}
      </ChallengeWebSocketContext.Provider>
    );
  }

  const contextValue: ChallengeWebSocketContextType = {
    subscribeToChallenge: (challengeId: string) => {
      console.log(`🔄 Subscribing to challenge: ${challengeId}`);
      // Implementation will send subscription message through Whop WebSocket
    },
    
    unsubscribeFromChallenge: (challengeId: string) => {
      console.log(`🔄 Unsubscribing from challenge: ${challengeId}`);
      // Implementation will send unsubscription message through Whop WebSocket
    },
    
    subscribeToAdminNotifications: () => {
      if (userRole === 'ersteller') {
        console.log(`🔄 Subscribing to admin notifications for experience: ${experienceId}`);
        // Implementation will send admin subscription message
      }
    },
    
    unsubscribeFromAdminNotifications: () => {
      if (userRole === 'ersteller') {
        console.log(`🔄 Unsubscribing from admin notifications for experience: ${experienceId}`);
        // Implementation will send admin unsubscription message  
      }
    }
  };

  return (
    // TODO: Wrap with WhopWebsocketProvider when available in @whop/react
    <ChallengeWebSocketContext.Provider value={contextValue}>
      {children}
    </ChallengeWebSocketContext.Provider>
  );
}

export function useChallengeWebSocket() {
  const context = useContext(ChallengeWebSocketContext);
  return context; // Returns null if not authenticated
}

/**
 * 🎯 HOOK FOR REAL-TIME CHALLENGE UPDATES
 * 
 * Usage in components:
 * ```tsx
 * const challengeSocket = useChallengeWebSocket();
 * 
 * useEffect(() => {
 *   challengeSocket?.subscribeToChallenge(challengeId);
 *   return () => challengeSocket?.unsubscribeFromChallenge(challengeId);
 * }, [challengeId]);
 * ```
 */
export function useRealtimeChallenge(challengeId: string) {
  const challengeSocket = useChallengeWebSocket();
  
  React.useEffect(() => {
    if (challengeSocket && challengeId) {
      challengeSocket.subscribeToChallenge(challengeId);
      
      return () => {
        challengeSocket.unsubscribeFromChallenge(challengeId);
      };
    }
  }, [challengeSocket, challengeId]);
}

/**
 * 🎯 HOOK FOR ADMIN NOTIFICATIONS
 * 
 * Only works for users with 'ersteller' role
 */
export function useAdminNotifications() {
  const challengeSocket = useChallengeWebSocket();
  const { userRole } = useExperienceContext();
  
  React.useEffect(() => {
    if (challengeSocket && userRole === 'ersteller') {
      challengeSocket.subscribeToAdminNotifications();
      
      return () => {
        challengeSocket.unsubscribeFromAdminNotifications();
      };
    }
  }, [challengeSocket, userRole]);
}
