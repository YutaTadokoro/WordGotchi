// EvolutionAnimation Component - Screen-wide evolution effect
// Requirements: 5.4

import { useEffect, useState } from 'react';
import { soundService } from '../services';
import './EvolutionAnimation.css';

// ============================================================================
// Props
// ============================================================================

interface EvolutionAnimationProps {
  fromStage: number;
  toStage: number;
  onComplete: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function EvolutionAnimation({ fromStage, toStage, onComplete }: EvolutionAnimationProps) {
  const [progress, setProgress] = useState(0);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    // Play evolution music when animation starts
    soundService.playEvolutionMusic();

    const duration = 3000; // 3 seconds
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min(elapsed / duration, 1);
      
      setProgress(currentProgress);

      // Show message at 30% progress
      if (currentProgress >= 0.3 && !showMessage) {
        setShowMessage(true);
      }

      if (currentProgress >= 1) {
        // Animation complete
        setTimeout(() => {
          onComplete();
        }, 500);
      } else {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [onComplete, showMessage]);

  // Calculate light intensity based on progress
  const lightIntensity = progress < 0.5 
    ? progress * 2 // Fade in
    : 2 - progress * 2; // Fade out

  const getStageName = (stage: number) => {
    if (stage === 1) return 'Obake';
    if (stage === 2) return 'Boofer';
    return `Stage ${stage}`;
  };

  return (
    <div className="evolution-animation">
      {/* Screen-wide light effect */}
      <div 
        className="evolution-light"
        style={{
          opacity: lightIntensity,
        }}
      />
      
      {/* Radial light burst */}
      <div 
        className="evolution-burst"
        style={{
          transform: `scale(${progress * 3})`,
          opacity: 1 - progress,
        }}
      />

      {/* Evolution message */}
      {showMessage && (
        <div 
          className="evolution-message"
          style={{
            opacity: progress > 0.7 ? 2 - progress * 2 : 1,
          }}
        >
          <h1>Evolution!</h1>
          <p>Your Gotchi has evolved to {getStageName(toStage)}!</p>
        </div>
      )}
    </div>
  );
}
