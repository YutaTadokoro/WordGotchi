// Integration test for feeding workflow
// Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.3, 3.1, 4.1

import { describe, it, expect, beforeEach } from 'vitest';
import { decomposeTextIntoWords, scatterWords } from '../utils';

describe('Feeding Workflow Integration', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should decompose text into words', () => {
    // Requirement 1.1: Text decomposition
    const text = 'Hello world, this is a test';
    const words = decomposeTextIntoWords(text);
    
    expect(words).toEqual(['Hello', 'world,', 'this', 'is', 'a', 'test']);
    expect(words.length).toBe(6);
  });

  it('should scatter words within canvas bounds', () => {
    // Requirement 1.1: Word scattering
    const words = ['Hello', 'world', 'test'];
    const canvasWidth = 800;
    const canvasHeight = 400;
    
    const scattered = scatterWords(words, canvasWidth, canvasHeight);
    
    expect(scattered).toHaveLength(3);
    
    // Verify all words are within bounds
    scattered.forEach(wordPos => {
      expect(wordPos.x).toBeGreaterThanOrEqual(0);
      expect(wordPos.x).toBeLessThanOrEqual(canvasWidth);
      expect(wordPos.y).toBeGreaterThanOrEqual(0);
      expect(wordPos.y).toBeLessThanOrEqual(canvasHeight);
    });
  });

  it('should handle empty text input', () => {
    // Edge case: Empty input
    const text = '';
    const words = decomposeTextIntoWords(text);
    
    expect(words).toEqual([]);
  });

  it('should handle whitespace-only input', () => {
    // Edge case: Whitespace only
    const text = '   \n\t  ';
    const words = decomposeTextIntoWords(text);
    
    expect(words).toEqual([]);
  });

  it('should handle single word input', () => {
    // Edge case: Single word
    const text = 'Hello';
    const words = decomposeTextIntoWords(text);
    
    expect(words).toEqual(['Hello']);
  });

  it('should preserve word order in decomposition', () => {
    // Verify word order is maintained
    const text = 'First second third fourth';
    const words = decomposeTextIntoWords(text);
    
    expect(words).toEqual(['First', 'second', 'third', 'fourth']);
  });

  it('should handle special characters in text', () => {
    // Test with punctuation and special characters
    const text = 'Hello! How are you? I\'m fine.';
    const words = decomposeTextIntoWords(text);
    
    expect(words.length).toBeGreaterThan(0);
    expect(words).toContain('Hello!');
    expect(words).toContain('you?');
  });

  it('should not create overlapping word positions', () => {
    // Requirement 1.1: Words should not overlap
    const words = ['word1', 'word2', 'word3', 'word4', 'word5'];
    const canvasWidth = 800;
    const canvasHeight = 400;
    
    const scattered = scatterWords(words, canvasWidth, canvasHeight);
    
    // Check that no two words have the exact same position
    const positions = scattered.map(w => `${w.x},${w.y}`);
    const uniquePositions = new Set(positions);
    
    expect(uniquePositions.size).toBe(scattered.length);
  });
});
