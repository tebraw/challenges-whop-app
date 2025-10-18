'use client';

import { useState, useEffect } from 'react';

interface LazyImageProps {
  challengeId: string;
  title: string;
  className?: string;
}

export default function LazyChallengeImage({ challengeId, title, className }: LazyImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      try {
        const response = await fetch(`/api/challenges/${challengeId}/image`);
        
        if (!response.ok) {
          throw new Error('Failed to load image');
        }

        const data = await response.json();
        
        if (data.success && data.imageUrl) {
          setImageUrl(data.imageUrl);
        } else {
          // No image available
          setImageUrl(null);
        }
      } catch (error) {
        console.error('Error loading challenge image:', error);
        setError(true);
        setImageUrl(null);
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [challengeId]);

  if (loading) {
    // Loading placeholder
    return (
      <div className={`bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center ${className}`}>
        <div className="animate-pulse">
          <span className="text-2xl opacity-50">📸</span>
        </div>
      </div>
    );
  }

  if (error || !imageUrl) {
    // Fallback when no image or error
    return (
      <div className={`bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center ${className}`}>
        <span className="text-4xl">🎯</span>
      </div>
    );
  }

  return (
    <img 
      src={imageUrl} 
      alt={title}
      className={className}
      onError={() => {
        setError(true);
        setImageUrl(null);
      }}
    />
  );
}