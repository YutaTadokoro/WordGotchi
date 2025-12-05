// Unit tests for utility functions

import { describe, it, expect } from 'vitest';
import { decomposeTextIntoWords, scatterWords } from './index';

describe('Word Feeding Utilities', () => {
  describe('decomposeTextIntoWords', () => {
    it('should split text into individual words', () => {
      const text = 'Hello world this is a test';
      const words = decomposeTextIntoWords(text);
      expect(words).toEqual(['Hello', 'world', 'this', 'is', 'a', 'test']);
    });

    it('should filter out empty strings', () => {
      const text = 'Hello  world   test';
      const words = decomposeTextIntoWords(text);
      expect(words).toEqual(['Hello', 'world', 'test']);
    });

    it('should handle text with newlines and tabs', () => {
      const text = 'Hello\nworld\ttest';
      const words = decomposeTextIntoWords(text);
      expect(words).toEqual(['Hello', 'world', 'test']);
    });

    it('should return empty array for empty string', () => {
      const text = '';
      const words = decomposeTextIntoWords(text);
      expect(words).toEqual([]);
    });

    it('should return empty array for whitespace-only string', () => {
      const text = '   \n\t  ';
      const words = decomposeTextIntoWords(text);
      expect(words).toEqual([]);
    });
  });

  describe('scatterWords', () => {
    it('should generate positions for all words', () => {
      const words = ['Hello', 'world', 'test'];
      const positions = scatterWords(words, 800, 400);
      expect(positions).toHaveLength(3);
      expect(positions[0].word).toBe('Hello');
      expect(positions[1].word).toBe('world');
      expect(positions[2].word).toBe('test');
    });

    it('should generate positions within canvas bounds', () => {
      const words = ['Hello', 'world'];
      const canvasWidth = 800;
      const canvasHeight = 400;
      const padding = 40;
      
      const positions = scatterWords(words, canvasWidth, canvasHeight);
      
      positions.forEach(pos => {
        expect(pos.x).toBeGreaterThanOrEqual(padding);
        expect(pos.x).toBeLessThanOrEqual(canvasWidth - padding);
        expect(pos.y).toBeGreaterThanOrEqual(padding);
        expect(pos.y).toBeLessThanOrEqual(canvasHeight - padding);
      });
    });

    it('should handle empty word array', () => {
      const words: string[] = [];
      const positions = scatterWords(words, 800, 400);
      expect(positions).toEqual([]);
    });

    it('should handle single word', () => {
      const words = ['Hello'];
      const positions = scatterWords(words, 800, 400);
      expect(positions).toHaveLength(1);
      expect(positions[0].word).toBe('Hello');
    });
  });
});
