"use client";
import React, { useEffect, useState } from "react";

interface ChallengeCountdownProps {
  endDate: string | Date;
}

function getTimeRemaining(endDate: Date) {
  const total = endDate.getTime() - new Date().getTime();
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  return { total, days, hours, minutes, seconds };
}

const ChallengeCountdown: React.FC<ChallengeCountdownProps> = ({ endDate }) => {
  let parsedDate: Date | null = null;
  if (endDate instanceof Date && !isNaN(endDate.getTime())) {
    parsedDate = endDate;
  } else if (typeof endDate === "string") {
    const d = new Date(endDate);
    if (!isNaN(d.getTime())) {
      parsedDate = d;
    }
  }

  const [timeLeft, setTimeLeft] = useState<{ total: number; days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!parsedDate) return;
    
    // Initial calculation after mount
    setTimeLeft(getTimeRemaining(parsedDate));
    
    const interval = setInterval(() => {
      setTimeLeft(getTimeRemaining(parsedDate!));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [endDate]);

  if (!isMounted) {
    // Return a placeholder during SSR to avoid hydration mismatch
    return <span>...</span>;
  }

  if (!parsedDate) {
    return <span className="text-red-500">Invalid end date</span>;
  }
  
  if (timeLeft && timeLeft.total <= 0) {
    return <span>Challenge ended!</span>;
  }
  
  if (!timeLeft) {
    return <span>...</span>;
  }
  
  return (
    <span>
      {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
    </span>
  );
};

export default ChallengeCountdown;
