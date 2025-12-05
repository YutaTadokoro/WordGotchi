// GlowEffect Component - Renders emotion-based glow around Gotchi
// Requirements: 6.4

import { memo, useMemo } from 'react';
import { Circle } from 'react-konva';
import type { EmotionVector } from '../types';
import { getDominantEmotion } from '../utils';

// ============================================================================
// Props
// ============================================================================

interface GlowEffectProps {
  emotionVector: EmotionVector;
  x: number;
  y: number;
}

// ============================================================================
// Emotion to Color Mapping
// ============================================================================

const EMOTION_COLORS: Record<string, string> = {
  joy: '#FFD700',      // golden
  sadness: '#4169E1',  // royal blue
  anger: '#DC143C',    // crimson
  fear: '#9370DB',     // medium purple
  surprise: '#FF69B4', // hot pink
  disgust: '#32CD32',  // lime green
  trust: '#87CEEB',    // sky blue
};

// ============================================================================
// Component
// ============================================================================

export const GlowEffect = memo(function GlowEffect({ emotionVector, x, y }: GlowEffectProps) {
  // Check if there are any active emotions - memoized
  const hasActiveEmotions = useMemo(() => 
    Object.values(emotionVector).some(
      (value, index) => index < 7 && value > 0
    ),
    [emotionVector]
  );

  // Get dominant emotion and corresponding color - memoized
  const { dominantEmotion, glowColor, intensity } = useMemo(() => {
    const emotion = getDominantEmotion(emotionVector);
    const color = EMOTION_COLORS[emotion] || '#FFFFFF';
    const emotionIntensity = emotionVector[emotion as keyof EmotionVector] as number;
    
    return {
      dominantEmotion: emotion,
      glowColor: color,
      intensity: emotionIntensity
    };
  }, [emotionVector]);

  if (!hasActiveEmotions) {
    return null;
  }

  return (
    <>
      {/* Outer glow ring */}
      <Circle
        x={x}
        y={y}
        radius={90}
        fill={glowColor}
        opacity={intensity * 0.1}
        shadowBlur={30}
        shadowColor={glowColor}
        shadowOpacity={intensity * 0.3}
      />
      
      {/* Middle glow ring */}
      <Circle
        x={x}
        y={y}
        radius={70}
        fill={glowColor}
        opacity={intensity * 0.15}
        shadowBlur={20}
        shadowColor={glowColor}
        shadowOpacity={intensity * 0.4}
      />
      
      {/* Inner glow ring */}
      <Circle
        x={x}
        y={y}
        radius={50}
        fill={glowColor}
        opacity={intensity * 0.2}
        shadowBlur={15}
        shadowColor={glowColor}
        shadowOpacity={intensity * 0.5}
      />
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if emotion vector values or position changed significantly
  const emotionChanged = Object.keys(prevProps.emotionVector).some(key => {
    if (key === 'lastUpdated') return false;
    return Math.abs(
      (prevProps.emotionVector[key as keyof EmotionVector] as number) - 
      (nextProps.emotionVector[key as keyof EmotionVector] as number)
    ) > 0.01; // Only re-render if emotion changed by more than 1%
  });
  
  return !emotionChanged && prevProps.x === nextProps.x && prevProps.y === nextProps.y;
});
