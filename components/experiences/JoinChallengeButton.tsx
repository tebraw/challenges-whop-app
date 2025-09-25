"use client";
import React from "react";
import { useRouter } from "next/navigation";
import ChallengeTermsModal from "./ChallengeTermsModal";

export default function JoinChallengeButton({
  challengeId,
  experienceId,
  isEnrolled,
  challenge,
  className = "",
}: { 
  challengeId: string; 
  experienceId: string;
  isEnrolled: boolean;
  challenge?: any; // Challenge data for terms modal
  className?: string;
}) {
  const [joining, setJoining] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [showTermsModal, setShowTermsModal] = React.useState(false);
  const router = useRouter();

  // Handle initial join click - show terms first
  function handleInitialJoin() {
    if (isEnrolled) return;
    
    // If no challenge data is available, join directly (backward compatibility)
    if (!challenge) {
      handleJoin();
      return;
    }
    
    setShowTermsModal(true);
  }

  // Handle terms acceptance - proceed with actual join
  function handleTermsAccepted() {
    setShowTermsModal(false);
    handleJoin();
  }

  // Handle terms decline - close modal
  function handleTermsDeclined() {
    setShowTermsModal(false);
  }

  async function handleJoin() {
    if (isEnrolled) return;
    
    try {
      setJoining(true);
      
      // Call the join API endpoint
      const res = await fetch(`/api/challenges/${challengeId}/join`, { 
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await res.json().catch(() => null);
      
      if (!res.ok || data?.error) {
        throw new Error(data?.error || `Error ${res.status}: Could not join challenge`);
      }
      
      // Handle paid entry flow
      if (data?.requirePayment) {
        // Professional UX: brief toast-like alert before redirect
        // In Whop iFrame, open in same tab to keep context
        const url = data.checkoutUrl as string | undefined;
        if (url) {
          alert('You’ll be redirected to secure Whop checkout to pay the entry fee. After payment, you will be enrolled automatically.');
          window.location.href = url;
          return;
        }
        // Fallback: if no URL, show graceful message
        alert('Payment required to join this challenge. Please try again in a moment.');
        return;
      }
      
      // Success! Show brief success feedback then redirect
      setShowSuccess(true);
      
      // Wait a moment to show success, then redirect to full challenge view
      setTimeout(() => {
        router.push(`/experiences/${experienceId}/c/${challengeId}`);
      }, 1500);
      
    } catch (e: any) {
      console.error('Join challenge error:', e);
      
      // Show user-friendly error messages
      let errorMessage = "Could not join challenge. Please try again.";
      if (e?.message?.includes('already ended')) {
        errorMessage = "This challenge has already ended.";
      } else if (e?.message?.includes('Already enrolled')) {
        errorMessage = "You're already participating in this challenge!";
      } else if (e?.message?.includes('Unauthorized')) {
        errorMessage = "Please log in to join this challenge.";
      }
      
      alert(errorMessage);
    } finally {
      setJoining(false);
    }
  }

  // Success state
  if (showSuccess) {
    return (
      <button 
        disabled
        className={`w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-500 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base lg:text-lg shadow-lg flex items-center gap-2 sm:gap-3 justify-center transform scale-105 min-h-[48px] sm:min-h-[56px] ${className}`}
      >
        <span className="text-lg sm:text-xl lg:text-2xl">✅</span>
        <span>Joined! Redirecting...</span>
      </button>
    );
  }

  // Already enrolled state
  if (isEnrolled) {
    return (
      <button 
        onClick={() => router.push(`/experiences/${experienceId}/c/${challengeId}`)}
        className={`w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all duration-300 font-semibold text-sm sm:text-base lg:text-lg shadow-lg hover:shadow-blue-500/25 transform hover:scale-105 flex items-center gap-2 sm:gap-3 justify-center min-h-[48px] sm:min-h-[56px] touch-target ${className}`}
      >
        <span className="text-lg sm:text-xl lg:text-2xl">📊</span>
        <span>View Full Challenge</span>
      </button>
    );
  }

  // Join button state
  return (
    <>
      <button 
        onClick={handleInitialJoin}
        disabled={joining}
        className={`w-full sm:w-auto relative overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-60 disabled:cursor-not-allowed px-4 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all duration-300 font-semibold text-sm sm:text-base lg:text-lg shadow-lg hover:shadow-purple-500/25 transform hover:scale-105 flex items-center gap-2 sm:gap-3 justify-center min-h-[48px] sm:min-h-[56px] touch-target ${className}`}
      >
        <span className="text-lg sm:text-xl lg:text-2xl relative z-10">{joining ? "⏳" : "🚀"}</span>
        <span className="relative z-10">{joining ? "Joining..." : "Join Challenge"}</span>
        
        {/* Animated background effect during join */}
        {joining && (
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform translate-x-[-100%] animate-pulse transition-transform duration-1000"></div>
        )}
      </button>

      {/* Terms Acceptance Modal */}
      {showTermsModal && challenge && (
        <ChallengeTermsModal
          challenge={challenge}
          mode="accept"
          onAccept={handleTermsAccepted}
          onDecline={handleTermsDeclined}
        />
      )}
    </>
  );
}