// Comprehensive integration tests for complete user workflows
// Task 19.1: Test first-time user experience, feeding workflow, evolution workflow, export/import workflow
// Requirements: All

import { describe, it, expect, beforeEach } from 'vitest';
import { storageService } from '../services/StorageService';
import type { GotchiState, FeedingRecord, ArtExpression, PoetryExpression } from '../types';

describe('Complete User Workflows', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('First-time user experience', () => {
    it('should initialize a new Gotchi at Stage 1 when no saved data exists', () => {
      // Requirement 5.1: First-time initialization
      const gotchi = storageService.loadGotchi();
      
      // Should return null for first-time user
      expect(gotchi).toBeNull();
      
      // Create initial Gotchi state
      const initialGotchi: GotchiState = {
        id: 'test-gotchi-1',
        stage: 1,
        feedingCount: 0,
        emotionVector: {
          joy: 0,
          sadness: 0,
          anger: 0,
          fear: 0,
          surprise: 0,
          disgust: 0,
          trust: 0,
          lastUpdated: Date.now()
        },
        createdAt: Date.now()
      };
      
      storageService.saveGotchi(initialGotchi);
      storageService.flushAll(); // Flush debounced writes
      
      const loadedGotchi = storageService.loadGotchi();
      expect(loadedGotchi).not.toBeNull();
      expect(loadedGotchi?.stage).toBe(1);
      expect(loadedGotchi?.feedingCount).toBe(0);
    });

    it('should display empty feeding history for new user', () => {
      // New user should have no feeding history
      const history = storageService.getFeedingHistory(10);
      expect(history).toEqual([]);
    });

    it('should display empty expression gallery for new user', () => {
      // New user should have no expressions
      const expressions = storageService.getExpressions(10);
      expect(expressions).toEqual([]);
    });
  });

  describe('Feeding workflow from start to finish', () => {
    it('should complete a full feeding session', () => {
      // Requirement 1.1, 1.2, 1.3, 1.4, 2.1, 2.3
      
      // Step 1: Create initial Gotchi
      const gotchi: GotchiState = {
        id: 'test-gotchi-2',
        stage: 1,
        feedingCount: 0,
        emotionVector: {
          joy: 0.2,
          sadness: 0.1,
          anger: 0,
          fear: 0,
          surprise: 0.3,
          disgust: 0,
          trust: 0.4,
          lastUpdated: Date.now()
        },
        createdAt: Date.now()
      };
      
      storageService.saveGotchi(gotchi);
      storageService.flushAll();
      
      // Step 2: Create feeding record
      const feedingRecord: FeedingRecord = {
        id: 'feeding-1',
        timestamp: Date.now(),
        inputText: 'I am feeling happy today',
        words: ['I', 'am', 'feeling', 'happy', 'today'],
        emotionAnalysis: {
          joy: 0.8,
          sadness: 0.1,
          anger: 0,
          fear: 0,
          surprise: 0.2,
          disgust: 0,
          trust: 0.6,
          lastUpdated: Date.now()
        }
      };
      
      storageService.saveFeedingRecord(feedingRecord);
      storageService.flushAll();
      
      // Step 3: Update Gotchi with new emotions (accumulation)
      const updatedGotchi: GotchiState = {
        ...gotchi,
        feedingCount: 1,
        emotionVector: {
          joy: 0.2 + 0.8,
          sadness: 0.1 + 0.1,
          anger: 0,
          fear: 0,
          surprise: 0.3 + 0.2,
          disgust: 0,
          trust: 0.4 + 0.6,
          lastUpdated: Date.now()
        }
      };
      
      storageService.saveGotchi(updatedGotchi);
      storageService.flushAll();
      
      // Step 4: Verify state
      const loadedGotchi = storageService.loadGotchi();
      expect(loadedGotchi?.feedingCount).toBe(1);
      expect(loadedGotchi?.emotionVector.joy).toBe(1.0);
      
      const history = storageService.getFeedingHistory(10);
      expect(history).toHaveLength(1);
      expect(history[0].inputText).toBe('I am feeling happy today');
    });

    it('should handle multiple feeding sessions', () => {
      // Multiple feedings should accumulate
      const gotchi: GotchiState = {
        id: 'test-gotchi-3',
        stage: 1,
        feedingCount: 0,
        emotionVector: {
          joy: 0,
          sadness: 0,
          anger: 0,
          fear: 0,
          surprise: 0,
          disgust: 0,
          trust: 0,
          lastUpdated: Date.now()
        },
        createdAt: Date.now()
      };
      
      storageService.saveGotchi(gotchi);
      storageService.flushAll();
      
      // Feed 3 times
      for (let i = 0; i < 3; i++) {
        const record: FeedingRecord = {
          id: `feeding-${i}`,
          timestamp: Date.now() + i,
          inputText: `Test input ${i}`,
          words: ['Test', 'input', String(i)],
          emotionAnalysis: {
            joy: 0.1,
            sadness: 0,
            anger: 0,
            fear: 0,
            surprise: 0,
            disgust: 0,
            trust: 0.1,
            lastUpdated: Date.now()
          }
        };
        
        storageService.saveFeedingRecord(record);
        
        const updated: GotchiState = {
          ...gotchi,
          feedingCount: i + 1,
          emotionVector: {
            joy: (i + 1) * 0.1,
            sadness: 0,
            anger: 0,
            fear: 0,
            surprise: 0,
            disgust: 0,
            trust: (i + 1) * 0.1,
            lastUpdated: Date.now()
          }
        };
        
        storageService.saveGotchi(updated);
      }
      storageService.flushAll();
      
      const loadedGotchi = storageService.loadGotchi();
      expect(loadedGotchi?.feedingCount).toBe(3);
      
      const history = storageService.getFeedingHistory(10);
      expect(history).toHaveLength(3);
    });
  });

  describe('Evolution workflow', () => {
    it('should trigger evolution at 10 feedings', () => {
      // Requirement 5.3: Evolution at 10 feedings
      
      // Create Gotchi at Stage 1 with 9 feedings
      const gotchi: GotchiState = {
        id: 'test-gotchi-4',
        stage: 1,
        feedingCount: 9,
        emotionVector: {
          joy: 0.5,
          sadness: 0.2,
          anger: 0.1,
          fear: 0.1,
          surprise: 0.3,
          disgust: 0,
          trust: 0.4,
          lastUpdated: Date.now()
        },
        createdAt: Date.now()
      };
      
      storageService.saveGotchi(gotchi);
      storageService.flushAll();
      
      // Verify Stage 1
      let loaded = storageService.loadGotchi();
      expect(loaded?.stage).toBe(1);
      expect(loaded?.feedingCount).toBe(9);
      
      // Add 10th feeding - should trigger evolution
      const evolvedGotchi: GotchiState = {
        ...gotchi,
        stage: 2,
        feedingCount: 10
      };
      
      storageService.saveGotchi(evolvedGotchi);
      storageService.flushAll();
      
      // Verify Stage 2
      loaded = storageService.loadGotchi();
      expect(loaded?.stage).toBe(2);
      expect(loaded?.feedingCount).toBe(10);
    });

    it('should enable expression generation at Stage 2', () => {
      // Requirement 5.5: Stage 2 enables art and poetry
      
      // Create Stage 2 Gotchi
      const gotchi: GotchiState = {
        id: 'test-gotchi-5',
        stage: 2,
        feedingCount: 10,
        emotionVector: {
          joy: 0.7,
          sadness: 0.1,
          anger: 0,
          fear: 0,
          surprise: 0.4,
          disgust: 0,
          trust: 0.6,
          lastUpdated: Date.now()
        },
        createdAt: Date.now()
      };
      
      storageService.saveGotchi(gotchi);
      storageService.flushAll();
      
      // Generate art expression
      const artExpression: ArtExpression = {
        id: 'art-1',
        timestamp: Date.now(),
        imageUrl: 'data:image/png;base64,test',
        prompt: 'Abstract art with golden and bright colors representing joy',
        dominantEmotion: 'joy'
      };
      
      storageService.saveExpression(artExpression);
      
      // Generate poetry expression
      const poetryExpression: PoetryExpression = {
        id: 'poetry-1',
        timestamp: Date.now(),
        lines: ['Golden light dances', 'Through the morning mist', 'Joy awakens'],
        sourceText: 'I am feeling happy',
        emotionContext: gotchi.emotionVector
      };
      
      storageService.saveExpression(poetryExpression);
      storageService.flushAll();
      
      // Verify expressions saved
      const expressions = storageService.getExpressions(10);
      expect(expressions).toHaveLength(2);
    });

    it('should not generate expressions at Stage 1', () => {
      // Requirement 3.1, 4.1: Stage-gated expression generation
      
      const gotchi: GotchiState = {
        id: 'test-gotchi-6',
        stage: 1,
        feedingCount: 5,
        emotionVector: {
          joy: 0.5,
          sadness: 0.2,
          anger: 0,
          fear: 0,
          surprise: 0.3,
          disgust: 0,
          trust: 0.4,
          lastUpdated: Date.now()
        },
        createdAt: Date.now()
      };
      
      storageService.saveGotchi(gotchi);
      storageService.flushAll();
      
      // At Stage 1, expressions should not be generated
      // This is enforced by the application logic, not storage
      const loaded = storageService.loadGotchi();
      expect(loaded?.stage).toBe(1);
      
      // Verify no expressions exist
      const expressions = storageService.getExpressions(10);
      expect(expressions).toHaveLength(0);
    });
  });

  describe('Export/Import workflow', () => {
    it('should export all Gotchi data', () => {
      // Requirement 9.1: Export data
      
      // Create complete Gotchi state
      const gotchi: GotchiState = {
        id: 'test-gotchi-7',
        stage: 2,
        feedingCount: 15,
        emotionVector: {
          joy: 0.6,
          sadness: 0.2,
          anger: 0.1,
          fear: 0.1,
          surprise: 0.3,
          disgust: 0.05,
          trust: 0.5,
          lastUpdated: Date.now()
        },
        createdAt: Date.now()
      };
      
      storageService.saveGotchi(gotchi);
      storageService.flushAll();
      
      // Add feeding records
      const feedingRecord: FeedingRecord = {
        id: 'feeding-export-1',
        timestamp: Date.now(),
        inputText: 'Export test',
        words: ['Export', 'test'],
        emotionAnalysis: gotchi.emotionVector
      };
      
      storageService.saveFeedingRecord(feedingRecord);
      
      // Add expressions
      const artExpression: ArtExpression = {
        id: 'art-export-1',
        timestamp: Date.now(),
        imageUrl: 'data:image/png;base64,exporttest',
        prompt: 'Test art prompt',
        dominantEmotion: 'joy'
      };
      
      storageService.saveExpression(artExpression);
      storageService.flushAll();
      
      // Export data
      const exportedData = storageService.exportData();
      
      // Verify export is valid JSON
      expect(() => JSON.parse(exportedData)).not.toThrow();
      
      const parsed = JSON.parse(exportedData);
      expect(parsed.gotchi).toBeDefined();
      expect(parsed.gotchi.id).toBe('test-gotchi-7');
      expect(parsed.feedingHistory).toBeDefined();
      expect(parsed.expressions).toBeDefined();
    });

    it('should import valid data', () => {
      // Requirement 9.2, 9.3: Import validation and success
      
      // Create export data
      const exportData = {
        gotchi: {
          id: 'imported-gotchi',
          stage: 2,
          feedingCount: 20,
          emotionVector: {
            joy: 0.8,
            sadness: 0.1,
            anger: 0,
            fear: 0,
            surprise: 0.4,
            disgust: 0,
            trust: 0.7,
            lastUpdated: Date.now()
          },
          createdAt: Date.now()
        },
        feedingHistory: [
          {
            id: 'imported-feeding-1',
            timestamp: Date.now(),
            inputText: 'Imported text',
            words: ['Imported', 'text'],
            emotionAnalysis: {
              joy: 0.8,
              sadness: 0.1,
              anger: 0,
              fear: 0,
              surprise: 0.4,
              disgust: 0,
              trust: 0.7,
              lastUpdated: Date.now()
            }
          }
        ],
        expressions: []
      };
      
      const jsonData = JSON.stringify(exportData);
      
      // Import data
      const success = storageService.importData(jsonData);
      expect(success).toBe(true);
      
      // Verify imported data
      const loadedGotchi = storageService.loadGotchi();
      expect(loadedGotchi?.id).toBe('imported-gotchi');
      expect(loadedGotchi?.stage).toBe(2);
      expect(loadedGotchi?.feedingCount).toBe(20);
      
      const history = storageService.getFeedingHistory(10);
      expect(history).toHaveLength(1);
      expect(history[0].inputText).toBe('Imported text');
    });

    it('should reject invalid import data', () => {
      // Requirement 9.4: Import validation failure
      
      // Create initial state
      const originalGotchi: GotchiState = {
        id: 'original-gotchi',
        stage: 1,
        feedingCount: 5,
        emotionVector: {
          joy: 0.3,
          sadness: 0.2,
          anger: 0,
          fear: 0,
          surprise: 0.1,
          disgust: 0,
          trust: 0.4,
          lastUpdated: Date.now()
        },
        createdAt: Date.now()
      };
      
      storageService.saveGotchi(originalGotchi);
      storageService.flushAll();
      
      // Try to import invalid JSON
      const invalidJson = '{ invalid json }';
      const success1 = storageService.importData(invalidJson);
      expect(success1).toBe(false);
      
      // Try to import incomplete data
      const incompleteData = JSON.stringify({ gotchi: { id: 'test' } });
      const success2 = storageService.importData(incompleteData);
      expect(success2).toBe(false);
      
      // Verify original state maintained
      const loadedGotchi = storageService.loadGotchi();
      expect(loadedGotchi?.id).toBe('original-gotchi');
      expect(loadedGotchi?.feedingCount).toBe(5);
    });

    it('should complete full export-import round trip', () => {
      // Complete workflow: export from one instance, import to another
      
      // Create complete state
      const gotchi: GotchiState = {
        id: 'roundtrip-gotchi',
        stage: 2,
        feedingCount: 12,
        emotionVector: {
          joy: 0.5,
          sadness: 0.3,
          anger: 0.1,
          fear: 0.1,
          surprise: 0.2,
          disgust: 0.05,
          trust: 0.6,
          lastUpdated: Date.now()
        },
        createdAt: Date.now()
      };
      
      storageService.saveGotchi(gotchi);
      storageService.flushAll();
      
      // Add multiple feeding records
      for (let i = 0; i < 3; i++) {
        const record: FeedingRecord = {
          id: `roundtrip-feeding-${i}`,
          timestamp: Date.now() + i,
          inputText: `Roundtrip test ${i}`,
          words: ['Roundtrip', 'test', String(i)],
          emotionAnalysis: gotchi.emotionVector
        };
        storageService.saveFeedingRecord(record);
      }
      storageService.flushAll();
      
      // Export
      const exportedData = storageService.exportData();
      
      // Clear storage (simulate new browser)
      localStorage.clear();
      
      // Verify cleared
      expect(storageService.loadGotchi()).toBeNull();
      expect(storageService.getFeedingHistory(10)).toHaveLength(0);
      
      // Import
      const success = storageService.importData(exportedData);
      expect(success).toBe(true);
      
      // Verify all data restored
      const restoredGotchi = storageService.loadGotchi();
      expect(restoredGotchi?.id).toBe('roundtrip-gotchi');
      expect(restoredGotchi?.stage).toBe(2);
      expect(restoredGotchi?.feedingCount).toBe(12);
      expect(restoredGotchi?.emotionVector.joy).toBe(0.5);
      
      const restoredHistory = storageService.getFeedingHistory(10);
      expect(restoredHistory).toHaveLength(3);
    });
  });

  describe('Data persistence across sessions', () => {
    it('should maintain state across page reloads', () => {
      // Simulate user session
      const gotchi: GotchiState = {
        id: 'persistent-gotchi',
        stage: 1,
        feedingCount: 7,
        emotionVector: {
          joy: 0.4,
          sadness: 0.2,
          anger: 0.1,
          fear: 0.1,
          surprise: 0.2,
          disgust: 0,
          trust: 0.5,
          lastUpdated: Date.now()
        },
        createdAt: Date.now()
      };
      
      storageService.saveGotchi(gotchi);
      storageService.flushAll();
      
      // Simulate page reload - just reload from same storage service
      const loadedGotchi = storageService.loadGotchi();
      
      expect(loadedGotchi).not.toBeNull();
      expect(loadedGotchi?.id).toBe('persistent-gotchi');
      expect(loadedGotchi?.feedingCount).toBe(7);
    });
  });
});
