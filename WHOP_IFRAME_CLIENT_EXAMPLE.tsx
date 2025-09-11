/**
 * 🎯 WHOP IFRAME CLIENT INTEGRATION EXAMPLE
 * Shows how to properly integrate @whop/iframe and @whop/react
 * 
 * Install first: npm install @whop/iframe @whop/react
 */
"use client";

import { useEffect, useState } from 'react';
// import { WhopIframeSdkProvider, useWhopIframeSdk } from '@whop/react';
// import { WhopWebsocketProvider, useOnWebsocketMessage, useBroadcastWebsocketMessage } from '@whop/react';

// Placeholder types until packages are installed
interface WhopIframeSdkProviderProps {
  children: React.ReactNode;
}

interface WhopWebsocketProviderProps {
  children: React.ReactNode;
  experienceId?: string;
}

// Mock components until real packages are installed
const WhopIframeSdkProvider = ({ children }: WhopIframeSdkProviderProps) => <div>{children}</div>;
const WhopWebsocketProvider = ({ children }: WhopWebsocketProviderProps) => <div>{children}</div>;

/**
 * 🎯 WHOP RULE #4: UI darf rendern, Logik bleibt Server
 * This component shows role-based UI rendering only
 */
interface ExperienceAppProps {
  experienceId: string;
  userRole: 'ersteller' | 'member' | 'guest';
  permissions: {
    canCreate: boolean;
    canManage: boolean;
    canParticipate: boolean;
    canViewAnalytics: boolean;
  };
}

export default function ExperienceApp({ experienceId, userRole, permissions }: ExperienceAppProps) {
  return (
    // 🎯 iFrame SDK Provider für postMessage APIs
    <WhopIframeSdkProvider>
      {/* 🎯 WHOP RULE #5: Realtime richtig benutzen */}
      <WhopWebsocketProvider experienceId={experienceId}>
        <div className="experience-app">
          <Header userRole={userRole} permissions={permissions} />
          
          {/* 🎯 WHOP RULE #10: Role-based UI rendering */}
          {userRole === 'guest' && <GuestView />}
          {userRole === 'member' && <MemberView permissions={permissions} />}
          {userRole === 'ersteller' && <CreatorView permissions={permissions} />}
          
          <RealtimeNotifications experienceId={experienceId} />
        </div>
      </WhopWebsocketProvider>
    </WhopIframeSdkProvider>
  );
}

/**
 * 🎯 WHOP RULE #10: Guest View - nur Public/Lite-Ansichten
 */
function GuestView() {
  return (
    <div className="guest-view">
      <h2>🌟 Welcome to Challenges</h2>
      <p>Join our community to access exclusive challenges!</p>
      <div className="public-challenges">
        {/* Only show public challenges */}
        <PublicChallengesList />
      </div>
      <div className="cta">
        <button>Join Community</button>
      </div>
    </div>
  );
}

/**
 * 🎯 WHOP RULE #10: Member View - darf konsumieren/teilnehmen
 */
function MemberView({ permissions }: { permissions: ExperienceAppProps['permissions'] }) {
  return (
    <div className="member-view">
      <h2>🎯 Your Challenges</h2>
      
      {permissions.canParticipate && (
        <>
          <MyChallenges />
          <AvailableChallenges />
          <ParticipationHistory />
        </>
      )}
      
      {/* 🎯 No creation/management UI for members */}
    </div>
  );
}

/**
 * 🎯 WHOP RULE #10: Creator View - darf konfigurieren, moderieren, veröffentlichen
 */
function CreatorView({ permissions }: { permissions: ExperienceAppProps['permissions'] }) {
  return (
    <div className="creator-view">
      <h2>🔧 Challenge Management</h2>
      
      {permissions.canCreate && (
        <div className="creator-actions">
          <button onClick={() => handleCreateChallenge()}>Create Challenge</button>
          <button onClick={() => handleManageRewards()}>Manage Rewards</button>
        </div>
      )}
      
      {permissions.canManage && (
        <>
          <ChallengeAnalytics />
          <ParticipantManagement />
          <RevenueManagement />
        </>
      )}
      
      {permissions.canViewAnalytics && (
        <AdvancedAnalytics />
      )}
    </div>
  );
}

/**
 * 🎯 WHOP RULE #5: Realtime richtig benutzen
 * Server sends trusted messages, client receives
 */
function RealtimeNotifications({ experienceId }: { experienceId: string }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Mock hook until real package is installed
  // const { sendMessage } = useBroadcastWebsocketMessage();
  // const { status } = useWebsocketStatus();
  
  // useOnWebsocketMessage((message) => {
  //   // 🎯 RULE #5: Only trust server messages
  //   if (message.isTrusted) {
  //     setNotifications(prev => [...prev, message]);
  //   }
  // });

  const handleClientBroadcast = () => {
    // 🎯 RULE #5: Client broadcasts nur für Low-Stakes (Cursor, UI updates)
    // sendMessage({ type: 'user_activity', action: 'viewing_challenge' });
  };

  return (
    <div className="realtime-notifications">
      {notifications.map((notification, i) => (
        <div key={i} className="notification">
          {notification.message}
        </div>
      ))}
    </div>
  );
}

// Helper Functions (🎯 WHOP RULE #4: Server Actions only)

async function handleCreateChallenge() {
  // 🎯 All mutations go to server
  try {
    const response = await fetch('/api/admin/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'New Challenge',
        description: 'Challenge description',
        // Server will scope to current experience
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to create challenge');
    }
    
    // UI updates after server confirmation
    window.location.reload();
  } catch (error) {
    alert('Creation failed: ' + error.message);
  }
}

async function handleManageRewards() {
  // 🎯 WHOP RULE #6: Payments - Server creates charge
  try {
    const response = await fetch('/api/payments/create-charge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'reward_product_123',
        metadata: {
          experienceId: 'current_experience_id',
          challengeId: 'challenge_123'
        }
      })
    });
    
    const { inAppPurchase } = await response.json();
    
    // 🎯 Client opens Checkout via iFrame-SDK
    // const iframeSdk = useWhopIframeSdk();
    // await iframeSdk.openCheckout(inAppPurchase);
    
    // 🎯 Server webhook validates & processes payment
    
  } catch (error) {
    alert('Payment setup failed: ' + error.message);
  }
}

// Placeholder components
function Header({ userRole, permissions }: { userRole: string; permissions: any }) {
  return (
    <header>
      <h1>Experience App</h1>
      <div>Role: {userRole}</div>
    </header>
  );
}

function PublicChallengesList() {
  return <div>Public challenges list...</div>;
}

function MyChallenges() {
  return <div>My challenges...</div>;
}

function AvailableChallenges() {
  return <div>Available challenges...</div>;
}

function ParticipationHistory() {
  return <div>Participation history...</div>;
}

function ChallengeAnalytics() {
  return <div>Challenge analytics...</div>;
}

function ParticipantManagement() {
  return <div>Participant management...</div>;
}

function RevenueManagement() {
  return <div>Revenue management...</div>;
}

function AdvancedAnalytics() {
  return <div>Advanced analytics...</div>;
}
