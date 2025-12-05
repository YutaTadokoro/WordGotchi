// Stable Diffusion API Client for art generation

import type { EmotionVector, ArtExpression } from '../types';

/**
 * Configuration for Stable Diffusion API
 */
interface StableDiffusionConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  timeout: number;
}

/**
 * Stable Diffusion API response structure
 */
interface StableDiffusionResponse {
  artifacts?: Array<{
    base64: string;
    finishReason: string;
  }>;
  id?: string;
  status?: string;
  message?: string;
}

/**
 * Client for interacting with Stable Diffusion API
 */
export class StableDiffusionClient {
  private config: StableDiffusionConfig;
  private retryConfig: RetryConfig = {
    maxRetries: 2,
    retryDelay: 2000,
    timeout: 60000,
  };

  constructor(config: StableDiffusionConfig) {
    // Use proxy in development, direct API in production
    const isDevelopment = import.meta.env.DEV;
    this.config = {
      baseUrl: isDevelopment ? '/api/stablediffusion/v1' : 'https://api.stability.ai/v1',
      model: 'stable-diffusion-xl-1024-v1-0',
      ...config,
    };
  }

  /**
   * Generate abstract art based on emotion vector
   */
  async generateArt(
    prompt: string,
    emotionVector: EmotionVector
  ): Promise<ArtExpression> {
    const imageData = await this.generateImageWithRetry(prompt);
    const dominantEmotion = this.getDominantEmotion(emotionVector);

    return {
      id: this.generateId(),
      timestamp: Date.now(),
      imageUrl: `data:image/png;base64,${imageData}`,
      prompt,
      dominantEmotion,
    };
  }

  /**
   * Generate image with retry logic
   */
  private async generateImageWithRetry(prompt: string): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const imageData = await this.generateImage(prompt);
        return imageData;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on the last attempt
        if (attempt === this.retryConfig.maxRetries) {
          break;
        }

        // Log retry attempt
        console.log(`Stable Diffusion API request failed (attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}), retrying in ${this.retryConfig.retryDelay}ms...`);

        // Wait before retrying
        await this.sleep(this.retryConfig.retryDelay);
      }
    }

    // Throw user-friendly error message
    const errorMessage = this.getUserFriendlyErrorMessage(lastError);
    throw new Error(errorMessage);
  }

  /**
   * Convert technical error to user-friendly message
   */
  private getUserFriendlyErrorMessage(error: Error | null): string {
    if (!error) {
      return 'Unable to generate artwork. Please try again.';
    }

    const message = error.message.toLowerCase();

    if (message.includes('timeout') || message.includes('abort')) {
      return 'Image generation took too long. Please try again.';
    }

    if (message.includes('network') || message.includes('fetch')) {
      return 'Network connection issue. Please check your internet and try again.';
    }

    if (message.includes('401') || message.includes('403') || message.includes('api key')) {
      return 'API authentication failed. Please check your API key configuration.';
    }

    if (message.includes('429') || message.includes('rate limit')) {
      return 'Too many requests. Please wait a moment and try again.';
    }

    if (message.includes('500') || message.includes('502') || message.includes('503')) {
      return 'Image generation service is temporarily unavailable. Please try again in a moment.';
    }

    if (message.includes('content policy') || message.includes('safety')) {
      return 'Unable to generate image due to content restrictions. Please try different text.';
    }

    return 'Unable to generate artwork. Please try again.';
  }

  /**
   * Make a single image generation request
   */
  private async generateImage(prompt: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.retryConfig.timeout
    );

    try {
      // In development, proxy handles auth headers
      const isDevelopment = import.meta.env.DEV;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      
      // Only add auth headers in production (proxy adds them in dev)
      if (!isDevelopment) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(
        `${this.config.baseUrl}/generation/${this.config.model}/text-to-image`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            text_prompts: [
              {
                text: prompt,
                weight: 1,
              },
            ],
            cfg_scale: 7,
            height: 1024,
            width: 1024,
            samples: 1,
            steps: 30,
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Stable Diffusion API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
        );
      }

      const data: StableDiffusionResponse = await response.json();

      if (!data.artifacts || data.artifacts.length === 0) {
        throw new Error('No image data in response');
      }

      const artifact = data.artifacts[0];
      
      if (artifact.finishReason !== 'SUCCESS') {
        throw new Error(`Image generation failed: ${artifact.finishReason}`);
      }

      return artifact.base64;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
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
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Create a Stable Diffusion client instance
 */
export function createStableDiffusionClient(apiKey: string): StableDiffusionClient {
  return new StableDiffusionClient({ apiKey });
}
