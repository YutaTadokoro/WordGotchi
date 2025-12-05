// Gemini API Client for art generation using Imagen

import type { EmotionVector, ArtExpression } from '../types';

/**
 * Configuration for Gemini API (proxy only)
 */
interface GeminiConfig {
  endpoint: string;
}



/**
 * Gemini API response structure for image generation
 */
interface GeminiImageResponse {
  predictions?: Array<{
    bytesBase64Encoded?: string;
    mimeType?: string;
  }>;
  error?: 
    | string  // Custom proxy error format
    | {       // Standard Gemini API error format
        code: number;
        message: string;
        status: string;
      };
}

/**
 * Client for interacting with Gemini API
 */
export class GeminiClient {
  private config: GeminiConfig;
  private timeout: number = 60000; // 60 seconds

  constructor(config: GeminiConfig) {
    this.config = config;
    console.log('🔵 [GeminiClient] Using proxy endpoint:', this.config.endpoint);
  }

  /**
   * Generate abstract art based on emotion vector
   */
  async generateArt(
    prompt: string,
    emotionVector: EmotionVector
  ): Promise<ArtExpression> {
    console.log('🎨 [GeminiClient] ========== GENERATE ART START ==========');
    console.log('🎨 [GeminiClient] Prompt:', prompt);
    console.log('🎨 [GeminiClient] Emotion vector:', emotionVector);
    
    try {
      const imageData = await this.generateImage(prompt);
      console.log('🎨 [GeminiClient] Image data received, length:', imageData.length);
      
      const dominantEmotion = this.getDominantEmotion(emotionVector);
      console.log('🎨 [GeminiClient] Dominant emotion:', dominantEmotion);

      const artExpression: ArtExpression = {
        id: this.generateId(),
        timestamp: Date.now(),
        imageUrl: `data:image/png;base64,${imageData}`,
        prompt,
        dominantEmotion,
      };
      
      console.log('🎨 [GeminiClient] Art expression created:', {
        id: artExpression.id,
        timestamp: artExpression.timestamp,
        imageUrlLength: artExpression.imageUrl.length,
        prompt: artExpression.prompt,
        dominantEmotion: artExpression.dominantEmotion
      });
      console.log('✅ [GeminiClient] ========== GENERATE ART SUCCESS ==========');
      
      return artExpression;
    } catch (error) {
      console.error('❌ [GeminiClient] ========== GENERATE ART FAILED ==========');
      console.error('❌ [GeminiClient] Error:', error);
      
      // Convert to user-friendly error message
      const userFriendlyMessage = this.getUserFriendlyErrorMessage(error as Error);
      throw new Error(userFriendlyMessage);
    }
  }

  /**
   * Convert technical error to user-friendly message
   */
  private getUserFriendlyErrorMessage(error: Error | null): string {
    if (!error) {
      return 'アートワークを生成できませんでした。もう一度お試しください。';
    }

    const message = error.message.toLowerCase();

    if (message.includes('timeout') || message.includes('abort')) {
      return '画像生成に時間がかかりすぎました。もう一度お試しください。';
    }

    if (message.includes('network') || message.includes('fetch')) {
      return 'ネットワーク接続に問題があります。インターネット接続を確認してください。';
    }

    if (message.includes('401') || message.includes('403') || message.includes('api key')) {
      return 'API認証に失敗しました。APIキーの設定を確認してください。';
    }

    if (message.includes('429') || message.includes('rate limit')) {
      return 'リクエストが多すぎます。しばらく待ってから再度お試しください。';
    }

    if (message.includes('500') || message.includes('502') || message.includes('503')) {
      return '画像生成サービスが一時的に利用できません。しばらくしてから再度お試しください。';
    }

    if (message.includes('content policy') || message.includes('safety')) {
      return 'コンテンツ制限により画像を生成できませんでした。別のテキストをお試しください。';
    }

    return 'アートワークを生成できませんでした。もう一度お試しください。';
  }

  /**
   * Make a single image generation request via proxy server
   */
  private async generateImage(prompt: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.timeout
    );

    try {
      // Proxy endpoint - proxy handles project ID, location, model, and auth
      const endpoint = `${this.config.endpoint}/generate`;
      console.log('🔵 [GeminiClient] ========== REQUEST START ==========');
      console.log('🔵 [GeminiClient] Endpoint:', endpoint);
      console.log('🔵 [GeminiClient] Prompt:', prompt);
      
      const requestBody = {
        instances: [
          {
            prompt: prompt,
          }
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: '1:1',
          safetyFilterLevel: 'block_some',
          personGeneration: 'allow_adult',
        }
      };
      console.log('🔵 [GeminiClient] Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('🔵 [GeminiClient] Response status:', response.status);
      console.log('🔵 [GeminiClient] Response ok:', response.ok);
      console.log('🔵 [GeminiClient] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        console.error('❌ [GeminiClient] Response not OK');
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [GeminiClient] Error data:', JSON.stringify(errorData, null, 2));
        throw new Error(
          `Gemini API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
        );
      }

      // レスポンスのテキストを取得してログ出力
      const responseText = await response.text();
      console.log('🔵 [GeminiClient] Raw response text length:', responseText.length);
      console.log('🔵 [GeminiClient] Raw response preview (first 500 chars):', responseText.substring(0, 500));

      // JSONをパース
      let data: GeminiImageResponse;
      try {
        data = JSON.parse(responseText);
        console.log('🔵 [GeminiClient] Parsed response structure:', {
          hasPredictions: !!data.predictions,
          predictionsLength: data.predictions?.length,
          hasError: !!data.error,
          keys: Object.keys(data)
        });
      } catch (parseError) {
        console.error('❌ [GeminiClient] JSON parse error:', parseError);
        console.error('❌ [GeminiClient] Failed to parse response text:', responseText);
        throw new Error(`Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }

      if (data.error) {
        console.error('❌ [GeminiClient] API returned error:', JSON.stringify(data.error, null, 2));
        // Handle both Gemini API error format and custom proxy error format
        const errorMessage = typeof data.error === 'string' 
          ? data.error 
          : (data.error.message || JSON.stringify(data.error));
        console.error('❌ [GeminiClient] Error message:', errorMessage);
        throw new Error(`Gemini API error: ${errorMessage}`);
      }

      if (!data.predictions || data.predictions.length === 0) {
        console.error('❌ [GeminiClient] No predictions in response');
        console.error('❌ [GeminiClient] Full response:', JSON.stringify(data, null, 2));
        throw new Error('No image data in response');
      }

      console.log('🔵 [GeminiClient] Number of predictions:', data.predictions.length);
      
      const prediction = data.predictions[0];
      console.log('🔵 [GeminiClient] First prediction structure:', {
        hasBytesBase64Encoded: !!prediction.bytesBase64Encoded,
        bytesLength: prediction.bytesBase64Encoded?.length,
        mimeType: prediction.mimeType,
        keys: Object.keys(prediction)
      });
      
      if (!prediction.bytesBase64Encoded) {
        console.error('❌ [GeminiClient] No bytesBase64Encoded in prediction');
        console.error('❌ [GeminiClient] Prediction object:', JSON.stringify(prediction, null, 2));
        throw new Error('Image generation failed: no image data');
      }

      console.log('✅ [GeminiClient] Successfully extracted base64 image data');
      console.log('🔵 [GeminiClient] Base64 data length:', prediction.bytesBase64Encoded.length);
      console.log('🔵 [GeminiClient] Base64 preview (first 100 chars):', prediction.bytesBase64Encoded.substring(0, 100));
      console.log('🔵 [GeminiClient] ========== REQUEST END ==========');

      return prediction.bytesBase64Encoded;
    } catch (error) {
      clearTimeout(timeoutId);
      
      console.error('❌ [GeminiClient] ========== ERROR ==========');
      console.error('❌ [GeminiClient] Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('❌ [GeminiClient] Error message:', error instanceof Error ? error.message : String(error));
      console.error('❌ [GeminiClient] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('❌ [GeminiClient] ========== ERROR END ==========');
      
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
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}

/**
 * Create a Gemini client instance
 */
export function createGeminiClient(endpoint: string): GeminiClient {
  return new GeminiClient({ endpoint });
}
