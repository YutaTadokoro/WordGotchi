// Tests for StorageService
import { describe, it, expect, beforeEach } from 'vitest';
import { storageService } from './StorageService';
import type { GotchiState, FeedingRecord, ArtExpression, PoetryExpression } from '../types';

describe('StorageService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Gotchi State Management', () => {
    it('should save and load Gotchi state', () => {
      const gotchiState: GotchiState = {
        id: 'test-gotchi-1',
        stage: 1,
        feedingCount: 5,
        emotionVector: {
          joy: 0.5,
          sadness: 0.2,
          anger: 0.1,
          fear: 0.0,
          surprise: 0.3,
          disgust: 0.0,
          trust: 0.4,
          lastUpdated: Date.now(),
        },
        createdAt: Date.now(),
      };

      storageService.saveGotchi(gotchiState);
      storageService.flushAll(); // Flush pending writes for test
      const loaded = storageService.loadGotchi();

      expect(loaded).not.toBeNull();
      expect(loaded?.id).toBe(gotchiState.id);
      expect(loaded?.stage).toBe(gotchiState.stage);
      expect(loaded?.feedingCount).toBe(gotchiState.feedingCount);
    });

    it('should return null when no Gotchi state exists', () => {
      const loaded = storageService.loadGotchi();
      expect(loaded).toBeNull();
    });

    it('should handle corrupted Gotchi data', () => {
      localStorage.setItem('wordgotchi.gotchi', 'invalid json');
      const loaded = storageService.loadGotchi();
      expect(loaded).toBeNull();
    });
  });

  describe('Feeding History Management', () => {
    it('should save and retrieve feeding records', () => {
      const record: FeedingRecord = {
        id: 'feed-1',
        timestamp: Date.now(),
        inputText: 'hello world',
        words: ['hello', 'world'],
        emotionAnalysis: {
          joy: 0.8,
          sadness: 0.0,
          anger: 0.0,
          fear: 0.0,
          surprise: 0.2,
          disgust: 0.0,
          trust: 0.5,
          lastUpdated: Date.now(),
        },
      };

      storageService.saveFeedingRecord(record);
      storageService.flushAll(); // Flush pending writes for test
      const history = storageService.getFeedingHistory(10);

      expect(history).toHaveLength(1);
      expect(history[0].id).toBe(record.id);
      expect(history[0].inputText).toBe(record.inputText);
    });

    it('should limit feeding history to specified count', () => {
      // Add multiple records
      for (let i = 0; i < 15; i++) {
        const record: FeedingRecord = {
          id: `feed-${i}`,
          timestamp: Date.now(),
          inputText: `text ${i}`,
          words: [`word${i}`],
          emotionAnalysis: {
            joy: 0.5,
            sadness: 0.0,
            anger: 0.0,
            fear: 0.0,
            surprise: 0.0,
            disgust: 0.0,
            trust: 0.0,
            lastUpdated: Date.now(),
          },
        };
        storageService.saveFeedingRecord(record);
      }
      storageService.flushAll(); // Flush pending writes for test

      const history = storageService.getFeedingHistory(10);
      expect(history).toHaveLength(10);
      // Should get the most recent 10
      expect(history[history.length - 1].id).toBe('feed-14');
    });
  });

  describe('Expression Management', () => {
    it('should save and retrieve art expressions', () => {
      const artExpression: ArtExpression = {
        id: 'art-1',
        timestamp: Date.now(),
        imageUrl: 'data:image/png;base64,test',
        prompt: 'golden bright colors',
        dominantEmotion: 'joy',
      };

      storageService.saveExpression(artExpression);
      storageService.flushAll(); // Flush pending writes for test
      const expressions = storageService.getExpressions(10);

      expect(expressions).toHaveLength(1);
      expect(expressions[0]).toMatchObject({
        id: artExpression.id,
        dominantEmotion: artExpression.dominantEmotion,
      });
    });

    it('should save and retrieve poetry expressions', () => {
      const poetryExpression: PoetryExpression = {
        id: 'poetry-1',
        timestamp: Date.now(),
        lines: ['Line one', 'Line two', 'Line three'],
        sourceText: 'original text',
        emotionContext: {
          joy: 0.3,
          sadness: 0.7,
          anger: 0.0,
          fear: 0.0,
          surprise: 0.0,
          disgust: 0.0,
          trust: 0.0,
          lastUpdated: Date.now(),
        },
      };

      storageService.saveExpression(poetryExpression);
      storageService.flushAll(); // Flush pending writes for test
      const expressions = storageService.getExpressions(10);

      expect(expressions).toHaveLength(1);
      expect(expressions[0]).toMatchObject({
        id: poetryExpression.id,
      });
    });
  });

  describe('Export and Import', () => {
    it('should export data as JSON', () => {
      const gotchiState: GotchiState = {
        id: 'test-gotchi',
        stage: 2,
        feedingCount: 10,
        emotionVector: {
          joy: 0.5,
          sadness: 0.2,
          anger: 0.1,
          fear: 0.0,
          surprise: 0.3,
          disgust: 0.0,
          trust: 0.4,
          lastUpdated: Date.now(),
        },
        createdAt: Date.now(),
      };

      storageService.saveGotchi(gotchiState);
      const exported = storageService.exportData();

      expect(exported).toBeTruthy();
      const parsed = JSON.parse(exported);
      expect(parsed.gotchi).toBeTruthy();
      expect(parsed.gotchi.id).toBe(gotchiState.id);
    });

    it('should import valid data', () => {
      const data = {
        gotchi: {
          id: 'imported-gotchi',
          stage: 1,
          feedingCount: 3,
          emotionVector: {
            joy: 0.5,
            sadness: 0.2,
            anger: 0.1,
            fear: 0.0,
            surprise: 0.3,
            disgust: 0.0,
            trust: 0.4,
            lastUpdated: Date.now(),
          },
          createdAt: Date.now(),
        },
        feedingHistory: [],
        expressions: [],
      };

      const result = storageService.importData(JSON.stringify(data));
      expect(result).toBe(true);

      const loaded = storageService.loadGotchi();
      expect(loaded?.id).toBe('imported-gotchi');
    });

    it('should reject invalid import data', () => {
      const result = storageService.importData('invalid json');
      expect(result).toBe(false);
    });
  });

  describe('Storage Size Management', () => {
    it('should check storage size', () => {
      const gotchiState: GotchiState = {
        id: 'test-gotchi',
        stage: 1,
        feedingCount: 0,
        emotionVector: {
          joy: 0.0,
          sadness: 0.0,
          anger: 0.0,
          fear: 0.0,
          surprise: 0.0,
          disgust: 0.0,
          trust: 0.0,
          lastUpdated: Date.now(),
        },
        createdAt: Date.now(),
      };

      storageService.saveGotchi(gotchiState);
      storageService.flushAll(); // Flush pending writes for test
      const size = storageService.checkStorageSize();

      expect(size).toBeGreaterThan(0);
    });

    it('should prune old data', () => {
      // Add many feeding records
      for (let i = 0; i < 100; i++) {
        const record: FeedingRecord = {
          id: `feed-${i}`,
          timestamp: Date.now(),
          inputText: `text ${i}`,
          words: [`word${i}`],
          emotionAnalysis: {
            joy: 0.5,
            sadness: 0.0,
            anger: 0.0,
            fear: 0.0,
            surprise: 0.0,
            disgust: 0.0,
            trust: 0.0,
            lastUpdated: Date.now(),
          },
        };
        storageService.saveFeedingRecord(record);
      }
      storageService.flushAll(); // Flush pending writes for test

      const beforePrune = storageService.getFeedingHistory(1000);
      expect(beforePrune.length).toBe(100);

      storageService.pruneOldData();

      const afterPrune = storageService.getFeedingHistory(1000);
      expect(afterPrune.length).toBe(80); // Should keep 80% (80 records)
    });
  });
});
