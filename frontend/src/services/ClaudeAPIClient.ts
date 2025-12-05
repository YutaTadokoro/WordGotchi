// Claude API Client for emotion analysis and poetry generation

import type { EmotionVector, PoetryExpression } from '../types';

/**
 * Configuration for Claude API (proxy only)
 */
interface ClaudeConfig {
  endpoint: string;
  model?: string;
}

/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  timeout: number;
}

/**
 * Claude API response structure
 */
interface ClaudeResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  id: string;
  model: string;
  role: string;
  stop_reason: string;
}

/**
 * Client for interacting with Claude API
 */
export class ClaudeAPIClient {
  private config: ClaudeConfig;
  private emotionRetryConfig: RetryConfig = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 4000,
    timeout: 30000,
  };
  private poetryRetryConfig: RetryConfig = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 4000,
    timeout: 30000,
  };

  constructor(config: ClaudeConfig) {
    this.config = {
      model: 'claude-sonnet-4-5',
      ...config,
    };
    console.log('🔵 [ClaudeAPI] Using proxy endpoint:', this.config.endpoint);
  }

  /**
   * Analyze text for emotional content
   * Extracts seven emotion values (joy, sadness, anger, fear, surprise, disgust, trust)
   * Returns neutral emotions as fallback on API failure
   */
  async analyzeEmotion(text: string): Promise<EmotionVector> {
    try {
      console.log('🟡 [ClaudeAPI] Analyzing emotion for text:', text);
      
      const prompt = `Analyze the emotional content of the following text and provide scores for seven basic emotions.
Return ONLY a JSON object with these exact keys: joy, sadness, anger, fear, surprise, disgust, trust.
Each value should be a number between 0 and 1, where 0 means the emotion is not present and 1 means it's very strong.

Text to analyze: "${text}"

Respond with ONLY the JSON object, no other text.`;

      console.log('🟡 [ClaudeAPI] Sending request to Claude API');
      const response = await this.makeRequestWithRetry(
        prompt,
        this.emotionRetryConfig
      );

      console.log('🟡 [ClaudeAPI] Received response:', response);
      const emotions = this.parseEmotionResponse(response);
      console.log('🟡 [ClaudeAPI] Parsed emotions:', emotions);
      
      return emotions;
    } catch (error) {
      console.error('❌ [ClaudeAPI] Emotion analysis failed, using neutral emotions:', error);
      // Return neutral emotions as fallback
      const neutralEmotions = this.getNeutralEmotions();
      console.log('🟡 [ClaudeAPI] Returning neutral emotions:', neutralEmotions);
      return neutralEmotions;
    }
  }

  /**
   * Generate poetry based on input text and emotion context
   * Returns a poem of 3-5 lines
   */
  async generatePoetry(
    inputText: string,
    emotionVector: EmotionVector
  ): Promise<PoetryExpression> {
    const emotionContext = this.formatEmotionContext(emotionVector);
    
    const prompt = `Create a short poem (3-5 lines) inspired by the following text and emotional context.
Use metaphors and symbols rather than direct emotional descriptions.
The poem should be evocative and abstract.

Input text: "${inputText}"

Emotional context: ${emotionContext}

Respond with ONLY the poem lines, one per line, no other text or formatting.`;

    const response = await this.makeRequestWithRetry(
      prompt,
      this.poetryRetryConfig
    );

    return this.parsePoetryResponse(response, inputText, emotionVector);
  }

  /**
   * Make API request with retry logic and exponential backoff
   */
  private async makeRequestWithRetry(
    prompt: string,
    retryConfig: RetryConfig
  ): Promise<string> {
    let lastError: Error | null = null;
    let delay = retryConfig.initialDelay;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        const response = await this.makeRequest(prompt, retryConfig.timeout);
        return response;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on the last attempt
        if (attempt === retryConfig.maxRetries) {
          break;
        }

        // Log retry attempt
        console.log(`Claude API request failed (attempt ${attempt + 1}/${retryConfig.maxRetries + 1}), retrying in ${delay}ms...`);

        // Wait before retrying with exponential backoff
        await this.sleep(delay);
        delay = Math.min(delay * 2, retryConfig.maxDelay);
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
      return 'Unable to connect to AI service. Please try again.';
    }

    const message = error.message.toLowerCase();

    if (message.includes('timeout') || message.includes('abort')) {
      return 'Request took too long. Please try again with shorter text.';
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
      return 'AI service is temporarily unavailable. Please try again in a moment.';
    }

    return 'Unable to process request. Please try again.';
  }

  /**
   * Make a single API request via proxy server
   */
  private async makeRequest(prompt: string, timeout: number): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      console.log('🔵 [ClaudeAPI] Requesting:', `${this.config.endpoint}/messages`);

      const response = await fetch(`${this.config.endpoint}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
      }

      const data: ClaudeResponse = await response.json();
      
      if (!data.content || data.content.length === 0) {
        throw new Error('Empty response from Claude API');
      }

      return data.content[0].text;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }

  /**
   * Parse emotion analysis response
   */
  private parseEmotionResponse(responseText: string): EmotionVector {
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[^}]+\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and normalize emotion values
      const emotions: EmotionVector = {
        joy: this.normalizeEmotionValue(parsed.joy),
        sadness: this.normalizeEmotionValue(parsed.sadness),
        anger: this.normalizeEmotionValue(parsed.anger),
        fear: this.normalizeEmotionValue(parsed.fear),
        surprise: this.normalizeEmotionValue(parsed.surprise),
        disgust: this.normalizeEmotionValue(parsed.disgust),
        trust: this.normalizeEmotionValue(parsed.trust),
        lastUpdated: Date.now(),
      };

      return emotions;
    } catch (error) {
      throw new Error(`Failed to parse emotion response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse poetry generation response
   */
  private parsePoetryResponse(
    responseText: string,
    sourceText: string,
    emotionContext: EmotionVector
  ): PoetryExpression {
    // Split response into lines and filter out empty lines
    const lines = responseText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    // Validate line count (3-5 lines)
    if (lines.length < 3 || lines.length > 5) {
      throw new Error(`Invalid poem length: expected 3-5 lines, got ${lines.length}`);
    }

    return {
      id: this.generateId(),
      timestamp: Date.now(),
      lines,
      sourceText,
      emotionContext,
    };
  }

  /**
   * Normalize emotion value to 0-1 range
   */
  private normalizeEmotionValue(value: unknown): number {
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    
    if (isNaN(num)) {
      return 0;
    }
    
    return Math.max(0, Math.min(1, num));
  }

  /**
   * Format emotion context for poetry prompt
   */
  private formatEmotionContext(vector: EmotionVector): string {
    const emotions = [
      `joy: ${vector.joy.toFixed(2)}`,
      `sadness: ${vector.sadness.toFixed(2)}`,
      `anger: ${vector.anger.toFixed(2)}`,
      `fear: ${vector.fear.toFixed(2)}`,
      `surprise: ${vector.surprise.toFixed(2)}`,
      `disgust: ${vector.disgust.toFixed(2)}`,
      `trust: ${vector.trust.toFixed(2)}`,
    ];
    return emotions.join(', ');
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
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Get neutral emotion vector as fallback
   */
  private getNeutralEmotions(): EmotionVector {
    return {
      joy: 0.14,
      sadness: 0.14,
      anger: 0.14,
      fear: 0.14,
      surprise: 0.14,
      disgust: 0.14,
      trust: 0.16,
      lastUpdated: Date.now(),
    };
  }
}

/**
 * Create a Claude API client instance
 */
export function createClaudeClient(endpoint: string): ClaudeAPIClient {
  return new ClaudeAPIClient({ endpoint });
}
