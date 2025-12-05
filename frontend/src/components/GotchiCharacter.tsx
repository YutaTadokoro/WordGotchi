// GotchiCharacter Component - Renders the Gotchi based on its stage
// Requirements: 5.1, 5.2

import { memo, useEffect, useState, useRef } from 'react';
import { Group, Circle, Image as KonvaImage } from 'react-konva';
import type { GotchiState } from '../types';
import kiroImage from '../assets/kiro.png';
import doggiImage from '../assets/doggi.png';

// ============================================================================
// Props
// ============================================================================

interface GotchiCharacterProps {
  gotchi: GotchiState;
  x: number;
  y: number;
  scale?: number;
  isGeneratingArt?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export const GotchiCharacter = memo(function GotchiCharacter({ gotchi, x, y, scale = 1, isGeneratingArt = false }: GotchiCharacterProps) {
  console.log('🔵 [GotchiCharacter] Rendering with:', { stage: gotchi.stage, isGeneratingArt });
  
  if (gotchi.stage === 1) {
    return <ObakeStage x={x} y={y} scale={scale} isGeneratingArt={isGeneratingArt} />;
  } else if (gotchi.stage === 2) {
    return <BooferStage x={x} y={y} scale={scale} isGeneratingArt={isGeneratingArt} />;
  }
  
  return null;
});

// ============================================================================
// Stage 1: Obake (化け) - Transparent white shadow
// ============================================================================

interface StageProps {
  x: number;
  y: number;
  scale: number;
  isGeneratingArt: boolean;
}

function ObakeStage({ x, y, scale, isGeneratingArt }: StageProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [rotation, setRotation] = useState(0);
  const animationRef = useRef<number | undefined>(undefined);

  console.log('🟡 [ObakeStage] Props:', { isGeneratingArt, rotation });

  useEffect(() => {
    const img = new window.Image();
    img.src = kiroImage;
    img.onload = () => {
      setImage(img);
    };
  }, []);

  useEffect(() => {
    console.log('🟡 [ObakeStage] useEffect triggered, isGeneratingArt:', isGeneratingArt);
    
    if (isGeneratingArt) {
      console.log('🟡 [ObakeStage] Starting rotation animation');
      // Start rotation animation
      const animate = () => {
        setRotation(prev => {
          const newRotation = (prev + 3) % 360;
          console.log('🟡 [ObakeStage] Rotating:', newRotation);
          return newRotation;
        });
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else {
      console.log('🟡 [ObakeStage] Stopping rotation animation');
      // Stop rotation and reset
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setRotation(0);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isGeneratingArt]);

  if (!image) {
    // Fallback while image is loading
    return (
      <Group x={x} y={y} scaleX={scale} scaleY={scale} rotation={rotation}>
        <Circle
          x={0}
          y={0}
          radius={40}
          fill="rgba(255, 255, 255, 0.15)"
          shadowBlur={20}
          shadowColor="rgba(255, 255, 255, 0.3)"
          shadowOpacity={0.5}
        />
      </Group>
    );
  }

  // Scale down the image to 80 pixels (adjust as needed)
  const displaySize = 80;
  
  return (
    <Group x={x} y={y} scaleX={scale} scaleY={scale} rotation={rotation}>
      <KonvaImage
        image={image}
        x={-displaySize / 2}
        y={-displaySize / 2}
        width={displaySize}
        height={displaySize}
        opacity={0.9}
        shadowBlur={20}
        shadowColor="rgba(255, 255, 255, 0.5)"
      />
    </Group>
  );
}

// ============================================================================
// Stage 2: Boofer - Evolved form with doggi image
// ============================================================================

function BooferStage({ x, y, scale, isGeneratingArt }: StageProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [rotation, setRotation] = useState(0);
  const animationRef = useRef<number | undefined>(undefined);

  console.log('🟢 [BooferStage] Props:', { isGeneratingArt, rotation });

  useEffect(() => {
    const img = new window.Image();
    img.src = doggiImage;
    img.onload = () => {
      setImage(img);
    };
  }, []);

  useEffect(() => {
    console.log('🟢 [BooferStage] useEffect triggered, isGeneratingArt:', isGeneratingArt);
    
    if (isGeneratingArt) {
      console.log('🟢 [BooferStage] Starting rotation animation');
      // Start rotation animation
      const animate = () => {
        setRotation(prev => {
          const newRotation = (prev + 3) % 360;
          console.log('🟢 [BooferStage] Rotating:', newRotation);
          return newRotation;
        });
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else {
      console.log('🟢 [BooferStage] Stopping rotation animation');
      // Stop rotation and reset
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setRotation(0);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isGeneratingArt]);

  if (!image) {
    // Fallback while image is loading
    return (
      <Group x={x} y={y} scaleX={scale} scaleY={scale} rotation={rotation}>
        <Circle
          x={0}
          y={0}
          radius={45}
          fill="rgba(232, 213, 255, 0.3)"
          shadowBlur={25}
          shadowColor="rgba(183, 148, 246, 0.5)"
          shadowOpacity={0.6}
        />
      </Group>
    );
  }

  // Scale the evolved image to 100 pixels (slightly larger than stage 1)
  const displaySize = 100;
  
  return (
    <Group x={x} y={y} scaleX={scale} scaleY={scale} rotation={rotation}>
      <KonvaImage
        image={image}
        x={-displaySize / 2}
        y={-displaySize / 2}
        width={displaySize}
        height={displaySize}
        opacity={1}
        shadowBlur={25}
        shadowColor="rgba(183, 148, 246, 0.5)"
      />
    </Group>
  );
}
