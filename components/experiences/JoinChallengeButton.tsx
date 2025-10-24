"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useIframeSdk } from "@whop/react";
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
  challenge?: any; // Challenge data for terms modal and pricing
  className?: string;
}) {
  const [joining, setJoining] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [showTermsModal, setShowTermsModal] = React.useState(false);
  const router = useRouter();
  const iframeSdk = useIframeSdk();

  // Check if challenge has paid entry fee
  const monetization = challenge?.monetizationRules;
  const isPaidChallenge = monetization && monetization.enabled && monetization.entryPriceCents > 0;
  const entryPrice = isPaidChallenge ? (monetization.entryPriceCents / 100).toFixed(2) : null;
  const entryCurrency = monetization?.entryCurrency || 'USD';

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
      
      // Call the join API endpoint with Experience context
      const res = await fetch(`/api/challenges/${challengeId}/join`, { 
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'x-experience-id': experienceId, // FIX: Include Experience ID for proper context
        }
      });
      
      const data = await res.json().catch(() => null);
      
      if (!res.ok || data?.error) {
        throw new Error(data?.error || `Error ${res.status}: Could not join challenge`);
      }
      
      // Handle paid entry flow
      if (data?.requirePayment) {
        const inAppPurchase = data.inAppPurchase;
        
        if (!inAppPurchase) {
          alert('Payment setup error. Please try again.');
          setJoining(false);
          return;
        }
        
        try {
          // Show inline payment modal
          const result = await iframeSdk.inAppPurchase(inAppPurchase);
          
          console.log('💳 Payment modal result:', result);
          
          if (result.status === 'ok') {
            // Payment successful! Create enrollment immediately
            console.log('✅ Payment successful! Receipt ID:', result.data.receiptId);
            
            setJoining(true);
            
            try {
              const confirmRes = await fetch(`/api/challenges/${challengeId}/confirm-enrollment`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-experience-id': experienceId,
                },
                body: JSON.stringify({
                  receiptId: result.data.receiptId,
                }),
              });
              
              const confirmData = await confirmRes.json();
              
              if (confirmRes.ok && confirmData.success) {
                console.log('🎉 Enrollment confirmed!', confirmData);
                setShowSuccess(true);
                
                // Redirect to challenge view
                setTimeout(() => {
                  router.push(`/experiences/${experienceId}/c/${challengeId}`);
                }, 1500);
              } else {
                console.error('❌ Enrollment confirmation failed:', confirmData);
                alert(confirmData.error || 'Failed to confirm enrollment. Please contact support.');
              }
            } catch (confirmError) {
              console.error('❌ Error confirming enrollment:', confirmError);
              alert('Failed to confirm enrollment. Please contact support with your receipt ID: ' + result.data.receiptId);
            }
          } else {
            // Payment cancelled or failed
            console.log('❌ Payment cancelled or failed:', result);
            alert('Payment was cancelled or failed. Please try again.');
          }
        } catch (error) {
          console.error('Payment modal error:', error);
          alert('Payment error. Please try again.');
        } finally {
          setJoining(false);
        }
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
        <span className="text-lg sm:text-xl lg:text-2xl"></span>
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
        <span className="text-lg sm:text-xl lg:text-2xl"></span>
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
        <span className="text-lg sm:text-xl lg:text-2xl relative z-10">{joining ? "" : "+"}</span>
        <span className="relative z-10">
          {joining ? "Joining..." : (isPaidChallenge ? `Join for $${entryPrice}` : "Join Challenge")}
        </span>
        
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