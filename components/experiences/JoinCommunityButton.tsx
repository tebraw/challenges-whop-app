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

  // Mobile-optimized redirect function
  const redirectToUrl = (url: string) => {
    console.log('🔗 Attempting redirect to:', url);
    
    // Strategy 1: Try window.location.href (works in most mobile environments)
    try {
      window.location.href = url;
      console.log('✅ Redirect via window.location.href');
      return;
    } catch (error) {
      console.log('❌ window.location.href failed:', error);
    }
    
    // Strategy 2: Try window.open (for desktop)
    try {
      const opened = window.open(url, '_blank');
      if (opened) {
        console.log('✅ Redirect via window.open');
        return;
      }
    } catch (error) {
      console.log('❌ window.open failed:', error);
    }
    
    // Strategy 3: Create and click a link element (fallback)
    try {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('✅ Redirect via link element');
    } catch (error) {
      console.log('❌ Link element failed:', error);
      // Last resort: copy to clipboard and show message
      navigator.clipboard?.writeText(url);
      alert(`Please visit: ${url}`);
    }
  };

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
        
        // Mobile-optimized redirect
        redirectToUrl(data.creatorProfileUrl);
        
        // Optional: Show success message
        if (data.urlType === 'handle') {
          console.log(`🎯 Redirecting to ${data.creatorInfo.title || creatorName}'s community!`);
        }
      } else {
        console.error('❌ Failed to get creator profile:', data.error);
        // Fallback to generic Whop URL
        redirectToUrl(data.fallbackUrl || 'https://whop.com');
      }
    } catch (error) {
      console.error('❌ Error getting creator profile:', error);
      // Ultimate fallback
      redirectToUrl('https://whop.com');
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