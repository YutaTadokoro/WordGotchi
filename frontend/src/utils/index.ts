// Utility functions for WordGotchi

import type { EmotionVector } from '../types';

// ============================================================================
// Emotion Utility Functions
// ============================================================================

/**
 * Apply emotion decay based on time elapsed
 * Emotions decay at 5% per day: decayedValue = currentValue * (0.95 ^ days)
 * 
 * @param vector - The emotion vector to apply decay to
 * @param daysSince - Number of days since last update
 * @returns New emotion vector with decay applied
 * 
 * Requirements: 2.4
 */
export function applyEmotionDecay(vector: EmotionVector, daysSince: number): EmotionVector {
  const decayFactor = Math.pow(0.95, daysSince);
  
  return {
    joy: vector.joy * decayFactor,
    sadness: vector.sadness * decayFactor,
    anger: vector.anger * decayFactor,
    fear: vector.fear * decayFactor,
    surprise: vector.surprise * decayFactor,
    disgust: vector.disgust * decayFactor,
    trust: vector.trust * decayFactor,
    lastUpdated: Date.now(),
  };
}

/**
 * Merge two emotion vectors by accumulation
 * Adds new emotion values to current values, capping at 1.0
 * 
 * @param current - Current emotion vector
 * @param newEmotions - New emotions to merge in
 * @returns Merged emotion vector
 * 
 * Requirements: 2.3
 */
export function mergeEmotions(current: EmotionVector, newEmotions: EmotionVector): EmotionVector {
  console.log('🟣 [mergeEmotions] Merging emotions:', {
    current,
    newEmotions
  });
  
  const merged = {
    joy: Math.min(1.0, current.joy + newEmotions.joy),
    sadness: Math.min(1.0, current.sadness + newEmotions.sadness),
    anger: Math.min(1.0, current.anger + newEmotions.anger),
    fear: Math.min(1.0, current.fear + newEmotions.fear),
    surprise: Math.min(1.0, current.surprise + newEmotions.surprise),
    disgust: Math.min(1.0, current.disgust + newEmotions.disgust),
    trust: Math.min(1.0, current.trust + newEmotions.trust),
    lastUpdated: Date.now(),
  };
  
  console.log('🟣 [mergeEmotions] Result:', merged);
  return merged;
}

/**
 * Detect the dominant emotion in an emotion vector
 * Returns the emotion with the highest value
 * 
 * @param vector - The emotion vector to analyze
 * @returns Name of the dominant emotion
 * 
 * Requirements: 2.3
 */
export function getDominantEmotion(vector: EmotionVector): string {
  const emotions = {
    joy: vector.joy,
    sadness: vector.sadness,
    anger: vector.anger,
    fear: vector.fear,
    surprise: vector.surprise,
    disgust: vector.disgust,
    trust: vector.trust,
  };
  
  let maxEmotion = 'joy';
  let maxValue = emotions.joy;
  
  for (const [emotion, value] of Object.entries(emotions)) {
    if (value > maxValue) {
      maxValue = value;
      maxEmotion = emotion;
    }
  }
  
  return maxEmotion;
}

// ============================================================================
// Word Feeding Utility Functions
// ============================================================================

/**
 * Decompose text into individual words
 * Splits input text by whitespace and filters out empty strings
 * 
 * @param text - The input text to decompose
 * @returns Array of individual words
 * 
 * Requirements: 1.1
 */
export function decomposeTextIntoWords(text: string): string[] {
  // Split by whitespace and filter out empty strings
  return text
    .split(/\s+/)
    .filter(word => word.trim().length > 0);
}

/**
 * Generate random positions for words within canvas bounds
 * Ensures words don't overlap by maintaining minimum distance
 * 
 * @param words - Array of words to scatter
 * @param canvasWidth - Width of the canvas area
 * @param canvasHeight - Height of the canvas area
 * @returns Array of word positions
 * 
 * Requirements: 1.1, 6.5
 */
export function scatterWords(
  words: string[],
  canvasWidth: number,
  canvasHeight: number
): Array<{ word: string; x: number; y: number }> {
  const positions: Array<{ word: string; x: number; y: number }> = [];
  const minDistance = 80; // Minimum distance between words to prevent overlap
  const padding = 40; // Padding from canvas edges
  const maxAttempts = 50; // Maximum attempts to find non-overlapping position

  for (const word of words) {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < maxAttempts) {
      // Generate random position within bounds
      const x = padding + Math.random() * (canvasWidth - 2 * padding);
      const y = padding + Math.random() * (canvasHeight - 2 * padding);

      // Check if position overlaps with existing words
      const overlaps = positions.some(pos => {
        const distance = Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2));
        return distance < minDistance;
      });

      if (!overlaps) {
        positions.push({ word, x, y });
        placed = true;
      }

      attempts++;
    }

    // If we couldn't find a non-overlapping position, place it anyway
    if (!placed) {
      const x = padding + Math.random() * (canvasWidth - 2 * padding);
      const y = padding + Math.random() * (canvasHeight - 2 * padding);
      positions.push({ word, x, y });
    }
  }

  return positions;
}

// ============================================================================
// Input Validation Functions
// ============================================================================

export * from './validation';
