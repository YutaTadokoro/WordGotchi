// Expression Service for generating art and poetry

import type { EmotionVector, ArtExpression, PoetryExpression } from '../types';
import { ClaudeAPIClient } from './ClaudeAPIClient';
import { GeminiClient } from './GeminiClient';

/**
 * Configuration for Expression Service
 */
interface ExpressionServiceConfig {
  claudeEndpoint: string;
  geminiEndpoint: string;
}

/**
 * Emotion to color mapping for art generation
 */
interface EmotionColorMapping {
  primary: string[];
  secondary: string[];
  mood: string;
}

/**
 * Service for generating artistic expressions (art and poetry)
 */
export class ExpressionService {
  private claudeClient: ClaudeAPIClient;
  private geminiClient: GeminiClient;

  constructor(config: ExpressionServiceConfig) {
    this.claudeClient = new ClaudeAPIClient({ endpoint: config.claudeEndpoint });
    this.geminiClient = new GeminiClient({ endpoint: config.geminiEndpoint });
  }

  /**
   * Build art generation prompt based on emotion vector
   * Maps emotions to appropriate color palettes
   * Requirements: 3.2, 3.3, 3.4
   */
  buildArtPrompt(emotionVector: EmotionVector): string {
    const dominantEmotion = this.getDominantEmotion(emotionVector);
    const colorMapping = this.getColorMapping(dominantEmotion);
    
    // Build abstract art prompt with emotion-based colors
    const prompt = `Abstract digital art, ${colorMapping.mood} atmosphere, ` +
      `featuring ${colorMapping.primary.join(', ')} colors with ` +
      `${colorMapping.secondary.join(', ')} accents, ` +
      `flowing organic shapes, ethereal and dreamlike, ` +
      `high quality, artistic, emotional expression`;

    return prompt;
  }

  /**
   * Generate abstract art based on emotion vector
   * Requirements: 3.1, 3.2
   */
  async generateArt(emotionVector: EmotionVector): Promise<ArtExpression> {
    const prompt = this.buildArtPrompt(emotionVector);
    return await this.geminiClient.generateArt(prompt, emotionVector);
  }

  /**
   * Generate poetry based on input text and emotion vector
   * Requirements: 4.1, 4.2
   */
  async generatePoetry(
    inputText: string, 
    emotionVector: EmotionVector
  ): Promise<PoetryExpression> {
    return await this.claudeClient.generatePoetry(inputText, emotionVector);
  }

  /**
   * Get dominant emotion from emotion vector
   */
  private getDominantEmotion(vector: EmotionVector): string {
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

  /**
   * Map emotion to color palette
   * Requirements: 3.2, 3.3, 3.4
   */
  private getColorMapping(emotion: string): EmotionColorMapping {
    const mappings: Record<string, EmotionColorMapping> = {
      joy: {
        primary: ['golden yellow', 'bright orange', 'warm amber'],
        secondary: ['soft pink', 'light cream'],
        mood: 'radiant and uplifting',
      },
      sadness: {
        primary: ['deep blue', 'purple', 'indigo'],
        secondary: ['soft grey', 'muted lavender'],
        mood: 'melancholic and contemplative',
      },
      anger: {
        primary: ['crimson red', 'dark orange', 'burnt sienna'],
        secondary: ['black', 'charcoal grey'],
        mood: 'intense and fiery',
      },
      fear: {
        primary: ['dark grey', 'shadowy black', 'deep violet'],
        secondary: ['pale blue', 'ghostly white'],
        mood: 'ominous and unsettling',
      },
      surprise: {
        primary: ['bright yellow', 'electric blue', 'vivid magenta'],
        secondary: ['white', 'silver'],
        mood: 'dynamic and energetic',
      },
      disgust: {
        primary: ['murky green', 'sickly yellow', 'brown'],
        secondary: ['dark grey', 'muddy purple'],
        mood: 'unsettling and visceral',
      },
      trust: {
        primary: ['soft blue', 'gentle green', 'warm beige'],
        secondary: ['cream', 'light gold'],
        mood: 'calm and reassuring',
      },
    };

    return mappings[emotion] || mappings.joy;
  }
}

/**
 * Create an Expression Service instance
 */
export function createExpressionService(
  claudeEndpoint: string,
  geminiEndpoint: string
): ExpressionService {
  return new ExpressionService({
    claudeEndpoint,
    geminiEndpoint,
  });
}
