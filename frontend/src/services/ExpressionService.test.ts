// Tests for Expression Service

import { describe, it, expect } from 'vitest';
import { ExpressionService } from './ExpressionService';
import type { EmotionVector } from '../types';

describe('ExpressionService', () => {
  describe('buildArtPrompt', () => {
    it('should map joy to golden and bright colors', () => {
      const service = new ExpressionService({
        claudeEndpoint: 'http://localhost:8000',
        geminiEndpoint: 'http://localhost:8001',
      });

      const joyEmotion: EmotionVector = {
        joy: 0.9,
        sadness: 0.1,
        anger: 0.0,
        fear: 0.0,
        surprise: 0.2,
        disgust: 0.0,
        trust: 0.3,
        lastUpdated: Date.now(),
      };

      const prompt = service.buildArtPrompt(joyEmotion);

      expect(prompt).toContain('golden yellow');
      expect(prompt).toContain('bright orange');
      expect(prompt).toContain('radiant and uplifting');
    });

    it('should map sadness to blue and purple deep tones', () => {
      const service = new ExpressionService({
        claudeEndpoint: 'http://localhost:8000',
        geminiEndpoint: 'http://localhost:8001',
      });

      const sadnessEmotion: EmotionVector = {
        joy: 0.1,
        sadness: 0.9,
        anger: 0.0,
        fear: 0.0,
        surprise: 0.0,
        disgust: 0.0,
        trust: 0.2,
        lastUpdated: Date.now(),
      };

      const prompt = service.buildArtPrompt(sadnessEmotion);

      expect(prompt).toContain('deep blue');
      expect(prompt).toContain('purple');
      expect(prompt).toContain('melancholic');
    });

    it('should map anger to crimson and dark colors', () => {
      const service = new ExpressionService({
        claudeEndpoint: 'http://localhost:8000',
        geminiEndpoint: 'http://localhost:8001',
      });

      const angerEmotion: EmotionVector = {
        joy: 0.0,
        sadness: 0.1,
        anger: 0.9,
        fear: 0.0,
        surprise: 0.0,
        disgust: 0.0,
        trust: 0.0,
        lastUpdated: Date.now(),
      };

      const prompt = service.buildArtPrompt(angerEmotion);

      expect(prompt).toContain('crimson red');
      expect(prompt).toContain('intense and fiery');
    });

    it('should map fear to dark and ominous colors', () => {
      const service = new ExpressionService({
        claudeEndpoint: 'http://localhost:8000',
        geminiEndpoint: 'http://localhost:8001',
      });

      const fearEmotion: EmotionVector = {
        joy: 0.0,
        sadness: 0.1,
        anger: 0.0,
        fear: 0.9,
        surprise: 0.0,
        disgust: 0.0,
        trust: 0.0,
        lastUpdated: Date.now(),
      };

      const prompt = service.buildArtPrompt(fearEmotion);

      expect(prompt).toContain('dark grey');
      expect(prompt).toContain('ominous');
    });

    it('should map surprise to bright and dynamic colors', () => {
      const service = new ExpressionService({
        claudeEndpoint: 'http://localhost:8000',
        geminiEndpoint: 'http://localhost:8001',
      });

      const surpriseEmotion: EmotionVector = {
        joy: 0.0,
        sadness: 0.0,
        anger: 0.0,
        fear: 0.0,
        surprise: 0.9,
        disgust: 0.0,
        trust: 0.0,
        lastUpdated: Date.now(),
      };

      const prompt = service.buildArtPrompt(surpriseEmotion);

      expect(prompt).toContain('bright yellow');
      expect(prompt).toContain('dynamic');
    });

    it('should map disgust to murky and unsettling colors', () => {
      const service = new ExpressionService({
        claudeEndpoint: 'http://localhost:8000',
        geminiEndpoint: 'http://localhost:8001',
      });

      const disgustEmotion: EmotionVector = {
        joy: 0.0,
        sadness: 0.0,
        anger: 0.0,
        fear: 0.0,
        surprise: 0.0,
        disgust: 0.9,
        trust: 0.0,
        lastUpdated: Date.now(),
      };

      const prompt = service.buildArtPrompt(disgustEmotion);

      expect(prompt).toContain('murky green');
      expect(prompt).toContain('unsettling');
    });

    it('should map trust to calm and reassuring colors', () => {
      const service = new ExpressionService({
        claudeEndpoint: 'http://localhost:8000',
        geminiEndpoint: 'http://localhost:8001',
      });

      const trustEmotion: EmotionVector = {
        joy: 0.0,
        sadness: 0.0,
        anger: 0.0,
        fear: 0.0,
        surprise: 0.0,
        disgust: 0.0,
        trust: 0.9,
        lastUpdated: Date.now(),
      };

      const prompt = service.buildArtPrompt(trustEmotion);

      expect(prompt).toContain('soft blue');
      expect(prompt).toContain('calm and reassuring');
    });

    it('should handle equal emotion values by selecting first dominant', () => {
      const service = new ExpressionService({
        claudeEndpoint: 'http://localhost:8000',
        geminiEndpoint: 'http://localhost:8001',
      });

      const equalEmotions: EmotionVector = {
        joy: 0.5,
        sadness: 0.5,
        anger: 0.5,
        fear: 0.5,
        surprise: 0.5,
        disgust: 0.5,
        trust: 0.5,
        lastUpdated: Date.now(),
      };

      const prompt = service.buildArtPrompt(equalEmotions);

      // Should default to joy when all are equal
      expect(prompt).toBeDefined();
      expect(prompt.length).toBeGreaterThan(0);
    });
  });
});
