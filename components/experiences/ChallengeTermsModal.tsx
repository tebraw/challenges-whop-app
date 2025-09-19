'use client'

interface ChallengeTermsModalProps {
  challenge: {
    rules?: any;
  };
}

export default function ChallengeTermsModal({ challenge }: ChallengeTermsModalProps) {
  const openModal = () => {
    const modal = document.getElementById('challenge-terms-modal');
    if (modal) {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  };

  const closeModal = () => {
    const modal = document.getElementById('challenge-terms-modal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  };

  return (
    <>
      {/* Terms & Policy Card for participants */}
      <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
        <button 
          onClick={openModal}
          className="w-full text-left hover:bg-purple-500/5 transition-all duration-200 rounded-xl p-2 -m-2 group"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform">📜</div>
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-bold text-purple-300 mb-1 leading-tight group-hover:text-purple-200 transition-colors">
                Challenge Terms & Policy
              </h3>
              <p className="text-gray-400 text-sm sm:text-base group-hover:text-gray-300 transition-colors">
                Click to view challenge guidelines and requirements
              </p>
            </div>
            <div className="text-gray-400 group-hover:text-purple-300 transition-colors">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </button>
      </div>

      {/* Challenge Terms Modal */}
      <div 
        id="challenge-terms-modal" 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 hidden items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            closeModal();
          }
        }}
      >
        <div className="bg-gray-900 border border-gray-700 rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <span className="text-3xl">📜</span>
              Challenge Terms & Policy
            </h2>
            <button
              onClick={closeModal}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="prose prose-invert max-w-none">
            {challenge.rules && 
             typeof challenge.rules === 'object' && 
             challenge.rules !== null &&
             'terms' in challenge.rules && 
             (challenge.rules as any).terms ? (
              <div className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                {(challenge.rules as any).terms}
              </div>
            ) : (
              <div className="text-gray-400 text-center py-8">
                <div className="text-4xl mb-4">📋</div>
                <p>No specific terms and policies have been set for this challenge.</p>
                <p className="mt-2 text-sm">Please follow general community guidelines and challenge requirements.</p>
              </div>
            )}
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-700">
            <button
              onClick={closeModal}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all duration-300 font-semibold text-white shadow-lg hover:shadow-purple-500/25"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </>
  );
}