'use client';

import { useState } from 'react';

interface WinsButtonProps {
  winsCount: number;
}

export default function WinsButton({ winsCount }: WinsButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openWinsModal = () => {
    setIsModalOpen(true);
  };

  const closeWinsModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="group bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-2xl p-6 text-center hover:border-yellow-400/40 transition-all duration-300">
        <div className="text-4xl mb-3">🏆</div>
        <div className="text-3xl font-bold text-yellow-400 mb-2">
          {winsCount}
        </div>
        <button 
          onClick={openWinsModal}
          className="text-yellow-400 font-medium hover:text-yellow-300 transition-colors"
        >
          Wins
        </button>
      </div>

      {/* Wins Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
          onClick={closeWinsModal}
        >
          <div 
            className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">🏆 Deine Wins</h3>
              <button 
                onClick={closeWinsModal} 
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="text-gray-300 text-center py-8">
              <div className="text-4xl mb-4">🎉</div>
              <p>Du hast noch keine Wins!</p>
              <p className="text-sm text-gray-400 mt-2">
                Schließe Challenges ab, um hier deine Benachrichtigungen zu sehen.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}