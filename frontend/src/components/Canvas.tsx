// Canvas Component - Main display area for Gotchi and interactions
// Requirements: 6.1, 6.3, 6.2, 10.5, 1.1, 1.2, 1.3, 2.1, 2.3, 3.1, 4.1

import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Stage, Layer, Rect, Circle, Text } from 'react-konva';
import { useGotchi } from '../contexts/GotchiContext';
import { GotchiCharacter } from './GotchiCharacter';
import { GlowEffect } from './GlowEffect';
import { ScatteredWord } from './ScatteredWord';
import { soundService } from '../services';
import { getDominantEmotion } from '../utils';
import { ClaudeAPIClient } from '../services/ClaudeAPIClient';
import { ExpressionService } from '../services/ExpressionService';
import type { EmotionVector } from '../types';

// ============================================================================
// Constants
// ============================================================================

// Responsive canvas height based on viewport
const getCanvasHeight = () => {
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  
  // Mobile portrait
  if (vw < 480) {
    return Math.min(300, vh * 0.4);
  }
  // Mobile landscape or tablet
  if (vw < 768 || (vh < 600 && vw < 1024)) {
    return Math.min(350, vh * 0.5);
  }
  // Desktop
  return 400;
};

const CANVAS_HEIGHT = getCanvasHeight();
const FLOAT_AMPLITUDE = 15; // pixels to move up and down
const FLOAT_FREQUENCY = 0.001; // speed of floating animation

// ============================================================================
// Component
// ============================================================================

export function Canvas() {
  const stageRef = useRef<any>(null);
  const { 
    gotchi, 
    currentFeedingWords,
    currentInputText,
    removeWord, 
    feedWords, 
    evolveGotchi,
    generateExpressions,
    showExpression,
    isGeneratingArt,
    setGeneratingArt,
    setGeneratingPoetry
  } = useGotchi();

  console.log('🔴 [Canvas] isGeneratingArt:', isGeneratingArt);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: getCanvasHeight(),
  });
  const [floatOffset, setFloatOffset] = useState(0);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const [isPlayingEmote, setIsPlayingEmote] = useState(false);
  const [emoteOffset, setEmoteOffset] = useState({ x: 0, y: 0 });
  const [emoteScale, setEmoteScale] = useState(1);
  const previousWordCountRef = useRef(currentFeedingWords.length);
  const [isProcessingFeeding, setIsProcessingFeeding] = useState(false);
  const savedInputTextRef = useRef<string>('');
  const [eatingWord, setEatingWord] = useState<{ word: string; x: number; y: number; progress: number } | null>(null);
  const [eatingFlash, setEatingFlash] = useState(false);
  const [emotionParticles, setEmotionParticles] = useState<Array<{ x: number; y: number; color: string; size: number; opacity: number; id: number }>>([]);

  // Handle window resize with debouncing for performance
  useEffect(() => {
    let resizeTimeout: number;
    
    const handleResize = () => {
      // Debounce resize events to reduce re-renders
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        setDimensions({
          width: window.innerWidth,
          height: getCanvasHeight(),
        });
      }, 150); // 150ms debounce
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  // Floating animation using sine wave
  // Requirements: 6.2, 10.5
  // Optimized: Throttle animation updates to 60fps max
  useEffect(() => {
    if (!gotchi) return;

    let startTime = Date.now();
    let lastFrameTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    const animate = (currentTime: number) => {
      // Throttle to target FPS
      if (currentTime - lastFrameTime < frameInterval) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      
      lastFrameTime = currentTime;
      const elapsed = Date.now() - startTime;
      // Use sine wave for smooth up-and-down motion
      const offset = Math.sin(elapsed * FLOAT_FREQUENCY) * FLOAT_AMPLITUDE;
      setFloatOffset(offset);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gotchi]);

  /**
   * Handle word click - animate word to Gotchi and remove it
   * Requirements: 1.2, 1.3
   * Optimized: Memoized with useCallback to prevent unnecessary re-renders
   */
  const handleWordClick = useCallback(async (word: string, x: number, y: number) => {
    // Find the word in currentFeedingWords to get its ID
    const wordToRemove = currentFeedingWords.find(
      w => w.word === word && w.x === x && w.y === y
    );
    
    if (!wordToRemove) return;

    // Resume audio context on user interaction
    await soundService.resumeAudioContext();

    // Calculate Gotchi position
    const gotchiX = dimensions.width / 2;
    const gotchiY = dimensions.height / 2 + floatOffset;
    
    // Start word eating animation with visual feedback
    const startTime = Date.now();
    const duration = 800;
    
    return new Promise<void>((resolve) => {
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        if (progress >= 1) {
          // Flash effect when word is eaten
          setEatingFlash(true);
          setTimeout(() => setEatingFlash(false), 150);
          
          // Play eating sound
          soundService.playEatingSound();
          
          // Remove word from display
          removeWord(wordToRemove.id);
          setEatingWord(null);
          
          resolve();
          return;
        }
        
        // Calculate bezier curve position
        const t = progress;
        const oneMinusT = 1 - t;
        const oneMinusTSquared = oneMinusT * oneMinusT;
        const oneMinusTCubed = oneMinusTSquared * oneMinusT;
        const tSquared = t * t;
        const tCubed = tSquared * t;
        
        // Control points for arc
        const controlPoint1X = x + (gotchiX - x) * 0.25 + (Math.random() - 0.5) * 50;
        const controlPoint1Y = y - 100;
        const controlPoint2X = x + (gotchiX - x) * 0.75 + (Math.random() - 0.5) * 50;
        const controlPoint2Y = gotchiY - 50;
        
        const currentX =
          oneMinusTCubed * x +
          3 * oneMinusTSquared * t * controlPoint1X +
          3 * oneMinusT * tSquared * controlPoint2X +
          tCubed * gotchiX;
        
        const currentY =
          oneMinusTCubed * y +
          3 * oneMinusTSquared * t * controlPoint1Y +
          3 * oneMinusT * tSquared * controlPoint2Y +
          tCubed * gotchiY;
        
        setEatingWord({ word, x: currentX, y: currentY, progress });
        
        requestAnimationFrame(animate);
      };
      
      requestAnimationFrame(animate);
    });
  }, [currentFeedingWords, dimensions.width, dimensions.height, floatOffset, removeWord]);

  /**
   * Save currentInputText to ref when it changes
   */
  useEffect(() => {
    if (currentInputText) {
      savedInputTextRef.current = currentInputText;
      console.log('💾 [Canvas] Saved input text:', currentInputText);
    }
  }, [currentInputText]);

  /**
   * Trigger emote animation and process feeding when all words are consumed
   * Requirements: 1.4, 2.1, 2.3, 3.1, 4.1
   */
  useEffect(() => {
    // Check if we just finished consuming all words
    const hadWords = previousWordCountRef.current > 0;
    const noWordsNow = currentFeedingWords.length === 0;
    
    console.log('🔴 [Canvas useEffect] Checking feeding completion:', {
      hadWords,
      noWordsNow,
      hasGotchi: !!gotchi,
      isPlayingEmote,
      isProcessingFeeding,
      currentWordCount: currentFeedingWords.length,
      previousWordCount: previousWordCountRef.current,
      currentInputText
    });
    
    if (hadWords && noWordsNow && gotchi && !isPlayingEmote && !isProcessingFeeding) {
      console.log('🔴 [Canvas useEffect] ✅ All conditions met, calling processFeedingCompletion');
      // Play completion sound and visual effect
      soundService.playCompletionSound();
      setEatingFlash(true);
      setTimeout(() => setEatingFlash(false), 300);
      
      // All words consumed, process the feeding
      processFeedingCompletion();
    } else {
      console.log('🔴 [Canvas useEffect] ❌ Conditions not met for processing');
    }
    
    previousWordCountRef.current = currentFeedingWords.length;
  }, [currentFeedingWords.length, gotchi, isPlayingEmote, isProcessingFeeding]);

  /**
   * Process feeding completion: emotion analysis, state update, and expression generation
   * Requirements: 2.1, 2.3, 3.1, 4.1
   */
  const processFeedingCompletion = async () => {
    const inputTextToProcess = savedInputTextRef.current;
    
    console.log('🟢 [processFeedingCompletion] Called with:', {
      hasGotchi: !!gotchi,
      currentInputText,
      savedInputText: inputTextToProcess,
      isProcessingFeeding
    });
    
    if (!gotchi || !inputTextToProcess || isProcessingFeeding) {
      console.log('🟢 [processFeedingCompletion] ❌ Early return - conditions not met');
      return;
    }
    
    setIsProcessingFeeding(true);
    
    try {
      // Get configuration from environment variables
      const claudeEndpoint = import.meta.env.VITE_CLAUDE_API_ENDPOINT || '';
      
      if (!claudeEndpoint) {
        console.warn('⚠️ [Canvas] Claude API endpoint not configured, using neutral emotions');
      }
      
      // Step 1: Analyze emotions from the input text
      let emotionAnalysis: EmotionVector;
      
      console.log('🟢 [Canvas] Starting emotion analysis for:', inputTextToProcess);
      
      if (claudeEndpoint) {
        try {
          console.log('🟢 [Canvas] Calling Claude API for emotion analysis');
          const claudeClient = new ClaudeAPIClient({ endpoint: claudeEndpoint });
          emotionAnalysis = await claudeClient.analyzeEmotion(inputTextToProcess);
          console.log('🟢 [Canvas] Claude API returned emotions:', emotionAnalysis);
        } catch (error) {
          console.error('❌ [Canvas] Error analyzing emotions:', error);
          // Fallback to neutral emotions
          emotionAnalysis = createNeutralEmotions();
          console.log('🟢 [Canvas] Using neutral emotions as fallback:', emotionAnalysis);
        }
      } else {
        console.warn('⚠️ [Canvas] No Claude API endpoint, using neutral emotions');
        emotionAnalysis = createNeutralEmotions();
        console.log('🟢 [Canvas] Neutral emotions:', emotionAnalysis);
      }
      
      // Step 2: Extract words from input text
      const words = inputTextToProcess.split(/\s+/).filter(w => w.length > 0);
      
      // Step 3: Update Gotchi state with new emotions
      console.log('🟢 [Canvas] Calling feedWords with emotions:', emotionAnalysis);
      feedWords(inputTextToProcess, words, emotionAnalysis);
      
      // Step 4: Play emote animation based on dominant emotion
      const dominantEmotion = getDominantEmotion(emotionAnalysis);
      await playEmoteAnimation(dominantEmotion);
      
      // Step 5: Check if evolution should trigger (Stage 1 with 10 feedings)
      const newFeedingCount = gotchi.feedingCount + 1;
      if (gotchi.stage === 1 && newFeedingCount >= 10) {
        evolveGotchi();
      }
      
      // Step 6: Generate expressions if at Stage 2
      if (gotchi.stage === 2 || (gotchi.stage === 1 && newFeedingCount >= 10)) {
        const geminiEndpoint = import.meta.env.VITE_GEMINI_API_ENDPOINT || '';
        
        if (claudeEndpoint && geminiEndpoint) {
          try {
            const expressionService = new ExpressionService({
              claudeEndpoint,
              geminiEndpoint,
            });
            
            console.log('🎨 [Canvas] Starting art and poetry generation');
            
            // Set generating flags
            setGeneratingArt(true);
            setGeneratingPoetry(true);
            
            // Generate art and poetry in parallel
            const [art, poetry] = await Promise.all([
              expressionService.generateArt(emotionAnalysis),
              expressionService.generatePoetry(inputTextToProcess, emotionAnalysis),
            ]);
            
            console.log('🎨 [Canvas] Art and poetry generation complete');
            
            // Clear generating flags
            setGeneratingArt(false);
            setGeneratingPoetry(false);
            
            // Save expressions
            generateExpressions(art, poetry);
            
            // Randomly show either art or poetry (50/50 chance)
            const showArt = Math.random() < 0.5;
            showExpression(showArt ? art : poetry);
          } catch (error) {
            console.error('Error generating expressions:', error);
            // Clear generating flags on error
            setGeneratingArt(false);
            setGeneratingPoetry(false);
          }
        } else {
          console.warn('API keys not configured, skipping expression generation');
        }
      }
    } catch (error) {
      console.error('Error processing feeding completion:', error);
    } finally {
      setIsProcessingFeeding(false);
      // Clear saved input text after processing
      savedInputTextRef.current = '';
      console.log('🟢 [processFeedingCompletion] ✅ Processing complete, cleared saved text');
    }
  };

  /**
   * Create neutral emotion vector as fallback
   * Optimized: Memoized to avoid recreating on every render
   */
  const createNeutralEmotions = useCallback((): EmotionVector => {
    return {
      joy: 0.1,
      sadness: 0.1,
      anger: 0.1,
      fear: 0.1,
      surprise: 0.1,
      disgust: 0.1,
      trust: 0.1,
      lastUpdated: Date.now(),
    };
  }, []);

  /**
   * Get emotion-specific visual properties
   */
  const getEmotionVisuals = (emotion: string) => {
    switch (emotion.toLowerCase()) {
      case 'joy':
        return { 
          color: '#FFD700', // 金色
          particleCount: 20,
          sound: 'joy'
        };
      case 'sadness':
        return { 
          color: '#4169E1', // 青
          particleCount: 15,
          sound: 'sadness'
        };
      case 'anger':
        return { 
          color: '#FF4500', // 赤
          particleCount: 25,
          sound: 'anger'
        };
      case 'fear':
        return { 
          color: '#9370DB', // 紫
          particleCount: 18,
          sound: 'fear'
        };
      case 'surprise':
        return { 
          color: '#FF69B4', // ピンク
          particleCount: 22,
          sound: 'surprise'
        };
      case 'disgust':
        return { 
          color: '#32CD32', // 緑
          particleCount: 12,
          sound: 'disgust'
        };
      case 'trust':
        return { 
          color: '#87CEEB', // 水色
          particleCount: 16,
          sound: 'trust'
        };
      default:
        return { 
          color: '#FFFFFF', // 白
          particleCount: 10,
          sound: 'neutral'
        };
    }
  };

  /**
   * Play emote animation with visual feedback
   * Requirements: 1.4, 1.5, 10.3
   */
  const playEmoteAnimation = async (emotion: string): Promise<void> => {
    if (isPlayingEmote) return;
    
    return new Promise((resolve) => {
      setIsPlayingEmote(true);
      
      // Get emotion-specific visuals
      const visuals = getEmotionVisuals(emotion);
      
      // Play emotion-specific sound
      soundService.playEmotionSound(visuals.sound);
      
      // Create emotion particles
      const particles: Array<{ x: number; y: number; color: string; size: number; opacity: number; id: number }> = [];
      for (let i = 0; i < visuals.particleCount; i++) {
        const angle = (Math.PI * 2 * i) / visuals.particleCount;
        const distance = 80 + Math.random() * 40;
        particles.push({
          x: gotchiX + Math.cos(angle) * distance,
          y: gotchiY + Math.sin(angle) * distance,
          color: visuals.color,
          size: 8 + Math.random() * 8,
          opacity: 0.8,
          id: i
        });
      }
      setEmotionParticles(particles);
      
      // Create custom animation based on emotion
      const startTime = Date.now();
      const duration = 2000; // 2 seconds max per requirements
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        if (progress >= 1) {
          setEmoteOffset({ x: 0, y: 0 });
          setEmoteScale(1);
          setEmotionParticles([]);
          setIsPlayingEmote(false);
          resolve();
          return;
        }
        
        // Update particle positions and opacity
        setEmotionParticles(prevParticles => 
          prevParticles.map(p => {
            const angle = Math.atan2(p.y - gotchiY, p.x - gotchiX);
            const newDistance = 80 + (progress * 120);
            return {
              ...p,
              x: gotchiX + Math.cos(angle) * newDistance,
              y: gotchiY + Math.sin(angle) * newDistance,
              opacity: 0.8 * (1 - progress)
            };
          })
        );
        
        // Apply emotion-specific animation
        switch (emotion.toLowerCase()) {
          case 'joy': {
            // Jumping animation - より大きく
            const jumpCount = 3;
            const jumpHeight = 60;
            const yOffset = -Math.abs(Math.sin(progress * Math.PI * jumpCount)) * jumpHeight;
            setEmoteOffset({ x: 0, y: yOffset });
            break;
          }
          case 'sadness': {
            // Sinking animation - よりゆっくり
            const sinkDepth = 40;
            const yOffset = Math.sin(progress * Math.PI) * sinkDepth;
            setEmoteOffset({ x: 0, y: yOffset });
            break;
          }
          case 'anger': {
            // Shaking animation - より激しく
            const shakeIntensity = 15;
            const shakeFrequency = 25;
            const xOffset = Math.sin(progress * Math.PI * shakeFrequency) * shakeIntensity * (1 - progress);
            setEmoteOffset({ x: xOffset, y: 0 });
            break;
          }
          case 'fear': {
            // Trembling animation - より細かく
            const trembleIntensity = 8;
            const trembleFrequency = 40;
            const xOffset = Math.sin(progress * Math.PI * trembleFrequency) * trembleIntensity;
            const yOffset = Math.cos(progress * Math.PI * trembleFrequency) * trembleIntensity;
            setEmoteOffset({ x: xOffset, y: yOffset });
            break;
          }
          case 'surprise': {
            // Sudden expansion - より大きく
            const scale = progress < 0.2 ? 1 + progress * 3 : 1 + (1 - progress) * 0.5;
            setEmoteScale(scale);
            break;
          }
          case 'disgust': {
            // Recoiling motion - より後ろに
            const recoilDistance = 30;
            const xOffset = Math.sin(progress * Math.PI) * recoilDistance;
            setEmoteOffset({ x: xOffset, y: 0 });
            break;
          }
          case 'trust': {
            // Gentle pulsing - より柔らかく
            const pulseCount = 3;
            const scale = 1 + Math.sin(progress * Math.PI * pulseCount) * 0.15;
            setEmoteScale(scale);
            break;
          }
          default: {
            // Neutral: subtle bob
            const bobHeight = 10;
            const yOffset = Math.sin(progress * Math.PI * 2) * bobHeight;
            setEmoteOffset({ x: 0, y: yOffset });
            break;
          }
        }
        
        requestAnimationFrame(animate);
      };
      
      requestAnimationFrame(animate);
    });
  };

  // Memoize gradient color stops to prevent recreation on every render
  const gradientColorStops = useMemo(() => [
    0, '#0a0014', // deep purple
    1, '#000000', // black
  ], []);

  // Memoize gradient points to prevent recreation on every render
  const gradientStartPoint = useMemo(() => ({ x: 0, y: 0 }), []);
  const gradientEndPoint = useMemo(() => ({ x: 0, y: dimensions.height }), [dimensions.height]);

  // Memoize Gotchi position calculations
  const gotchiX = useMemo(() => dimensions.width / 2 + emoteOffset.x, [dimensions.width, emoteOffset.x]);
  const gotchiY = useMemo(() => dimensions.height / 2 + floatOffset + emoteOffset.y, [dimensions.height, floatOffset, emoteOffset.y]);

  return (
    <div style={{ width: '100%', height: CANVAS_HEIGHT, position: 'relative' }}>
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
      >
        {/* Background Layer with gradient - cached for performance */}
        <Layer listening={false}>
          <Rect
            x={0}
            y={0}
            width={dimensions.width}
            height={dimensions.height}
            fillLinearGradientStartPoint={gradientStartPoint}
            fillLinearGradientEndPoint={gradientEndPoint}
            fillLinearGradientColorStops={gradientColorStops}
          />
        </Layer>

        {/* Effects Layer - for glow effects */}
        <Layer name="effects" listening={false}>
          {gotchi && (
            <GlowEffect
              emotionVector={gotchi.emotionVector}
              x={gotchiX}
              y={gotchiY}
            />
          )}
        </Layer>

        {/* Gotchi Character Layer */}
        <Layer name="gotchi" listening={false}>
          {gotchi && (
            <GotchiCharacter
              gotchi={gotchi}
              x={gotchiX}
              y={gotchiY}
              scale={emoteScale}
              isGeneratingArt={isGeneratingArt}
            />
          )}
          
          {/* Eating flash effect */}
          {eatingFlash && (
            <>
              <Circle
                x={gotchiX}
                y={gotchiY}
                radius={60}
                fill="rgba(255, 255, 255, 0.6)"
                opacity={0.8}
              />
              <Circle
                x={gotchiX}
                y={gotchiY}
                radius={80}
                fill="rgba(183, 148, 246, 0.4)"
                opacity={0.6}
              />
              <Circle
                x={gotchiX}
                y={gotchiY}
                radius={100}
                fill="rgba(232, 213, 255, 0.3)"
                opacity={0.4}
              />
            </>
          )}
          
          {/* Emotion particles */}
          {emotionParticles.map((particle) => (
            <Circle
              key={particle.id}
              x={particle.x}
              y={particle.y}
              radius={particle.size}
              fill={particle.color}
              opacity={particle.opacity}
              shadowBlur={15}
              shadowColor={particle.color}
            />
          ))}
        </Layer>

        {/* Words Layer - for scattered words during feeding */}
        <Layer name="words">
          {currentFeedingWords
            .filter(wordPos => !eatingWord || wordPos.word !== eatingWord.word)
            .map((wordPos) => (
              <ScatteredWord
                key={wordPos.id}
                word={wordPos.word}
                x={wordPos.x}
                y={wordPos.y}
                onClick={handleWordClick}
              />
            ))}
          
          {/* Animated eating word with trail effect */}
          {eatingWord && (
            <>
              {/* Trail particles */}
              {[0, 1, 2, 3, 4].map((i) => {
                const trailProgress = Math.max(0, eatingWord.progress - i * 0.1);
                const trailOpacity = (1 - i * 0.2) * (1 - trailProgress);
                return (
                  <Circle
                    key={`trail-${i}`}
                    x={eatingWord.x}
                    y={eatingWord.y}
                    radius={8 - i}
                    fill="#b794f6"
                    opacity={trailOpacity}
                  />
                );
              })}
              
              {/* Main eating word */}
              <Text
                text={eatingWord.word}
                x={eatingWord.x}
                y={eatingWord.y}
                fontSize={18 * (1 - eatingWord.progress * 0.5)}
                fontFamily="Inter, sans-serif"
                fill="#ffffff"
                opacity={1 - eatingWord.progress * 0.3}
                shadowBlur={10}
                shadowColor="#b794f6"
                offsetX={eatingWord.word.length * 4.5}
                offsetY={9}
              />
              
              {/* Sparkle particles around the word */}
              {[0, 1, 2, 3].map((i) => {
                const angle = (i * Math.PI * 2) / 4 + eatingWord.progress * Math.PI * 2;
                const distance = 20 + eatingWord.progress * 10;
                const sparkleX = eatingWord.x + Math.cos(angle) * distance;
                const sparkleY = eatingWord.y + Math.sin(angle) * distance;
                return (
                  <Circle
                    key={`sparkle-${i}`}
                    x={sparkleX}
                    y={sparkleY}
                    radius={3}
                    fill="#ffffff"
                    opacity={(1 - eatingWord.progress) * 0.8}
                  />
                );
              })}
            </>
          )}
        </Layer>
      </Stage>
    </div>
  );
}
