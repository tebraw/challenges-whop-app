'use client';

import { useState, useEffect } from 'react';
import ExperienceWinsModal from '@/components/experiences/ExperienceWinsModal';

interface WinsButtonProps {
  winsCount: number; // Legacy prop - not used anymore
  experienceId: string;
}

export default function WinsButton({ experienceId }: WinsButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // Load notification count (same as bell system)
  useEffect(() => {
    const loadNotificationCount = async () => {
      try {
        const response = await fetch('/api/internal/notifications');
        if (response.ok) {
          const data = await response.json();
          setNotificationCount(data.notifications?.length || 0);
        }
      } catch (error) {
        console.error('Failed to load notification count:', error);
        setNotificationCount(0);
      }
    };

    loadNotificationCount();
  }, []);

  return (
    <>
      <div className="group bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-2xl p-6 text-center hover:border-yellow-400/40 transition-all duration-300">
        <div className="text-4xl mb-3">🏆</div>
        <div className="text-3xl font-bold text-yellow-400 mb-2">
          {notificationCount}
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="text-yellow-400 font-medium hover:text-yellow-300 transition-colors"
        >
          Wins
        </button>
      </div>

      {/* Experience Wins Modal - Same data as notification bell, but prettier! */}
      <ExperienceWinsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        experienceId={experienceId}
      />
    </>
  );
}