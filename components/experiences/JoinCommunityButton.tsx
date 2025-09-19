'use client';

import { useState } from 'react';

interface JoinCommunityButtonProps {
  challengeId: string;
  challengeTitle: string;
  creatorName: string;
}

export default function JoinCommunityButton({ 
  challengeId, 
  challengeTitle, 
  creatorName 
}: JoinCommunityButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinCommunity = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      console.log('🚀 Getting Challenge Creator profile...', { challengeId });
      
      // Call our new API to get Challenge Creator profile URL
      const response = await fetch(`/api/challenges/${challengeId}/creator-profile`);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Got Creator Profile URL:', {
          url: data.creatorProfileUrl,
          type: data.urlType,
          creatorInfo: data.creatorInfo
        });
        
        // Redirect to Challenge Creator's Whop profile
        window.open(data.creatorProfileUrl, '_blank');
        
        // Optional: Show success message
        if (data.urlType === 'handle') {
          console.log(`🎯 Redirecting to ${data.creatorInfo.title || creatorName}'s community!`);
        }
      } else {
        console.error('❌ Failed to get creator profile:', data.error);
        // Fallback to generic Whop URL
        window.open(data.fallbackUrl || 'https://whop.com', '_blank');
      }
    } catch (error) {
      console.error('❌ Error getting creator profile:', error);
      // Ultimate fallback
      window.open('https://whop.com', '_blank');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={handleJoinCommunity}
      disabled={isLoading}
      className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          Loading...
        </>
      ) : (
        <>
          🚀 Join Community to Participate
        </>
      )}
    </button>
  );
}