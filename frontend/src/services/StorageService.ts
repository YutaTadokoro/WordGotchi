// Storage Service for WordGotchi
// Handles localStorage operations with error handling and size management

import type {
  GotchiState,
  FeedingRecord,
  ArtExpression,
  PoetryExpression,
  StorageService,
} from '../types';

// Storage keys
const STORAGE_KEY_PREFIX = 'wordgotchi';
const GOTCHI_KEY = `${STORAGE_KEY_PREFIX}.gotchi`;
const FEEDING_HISTORY_KEY = `${STORAGE_KEY_PREFIX}.feedingHistory`;
const EXPRESSIONS_KEY = `${STORAGE_KEY_PREFIX}.expressions`;

// Storage limits
const MAX_FEEDING_RECORDS = 1000;
const MAX_EXPRESSIONS = 500;
const MAX_STORAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// Performance optimization settings
const DEBOUNCE_DELAY_MS = 500; // Debounce writes by 500ms
const BATCH_SIZE = 10; // Batch multiple operations together

// Memory-only storage fallback
let memoryOnlyMode = false;
let memoryStorage: {
  gotchi: GotchiState | null;
  feedingHistory: FeedingRecord[];
  expressions: (ArtExpression | PoetryExpression)[];
} = {
  gotchi: null,
  feedingHistory: [],
  expressions: [],
};

// Debounce timers for batched writes
let gotchiSaveTimer: ReturnType<typeof setTimeout> | null = null;
let feedingSaveTimer: ReturnType<typeof setTimeout> | null = null;
let expressionSaveTimer: ReturnType<typeof setTimeout> | null = null;

// Pending batched operations
let pendingGotchiState: GotchiState | null = null;
let pendingFeedingRecords: FeedingRecord[] = [];
let pendingExpressions: (ArtExpression | PoetryExpression)[] = [];

/**
 * Implementation of StorageService using localStorage
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 9.1, 9.2, 9.3, 9.4, 9.5
 */
class StorageServiceImpl implements StorageService {
  /**
   * Check if localStorage is available
   */
  private isLocalStorageAvailable(): boolean {
    if (memoryOnlyMode) {
      return false;
    }

    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      console.warn('localStorage is not available, switching to memory-only mode');
      memoryOnlyMode = true;
      return false;
    }
  }

  /**
   * Check if storage size exceeds limit and prune if necessary
   * Optimized: Compress data if approaching limits (80% threshold)
   * Requirements: 8.6
   */
  private checkAndPruneIfNeeded(): void {
    if (!this.isLocalStorageAvailable()) {
      return;
    }

    const currentSize = this.checkStorageSize();
    const compressionThreshold = MAX_STORAGE_SIZE_BYTES * 0.8; // 80% of max
    
    // If approaching limit, compress by removing whitespace from stored JSON
    if (currentSize > compressionThreshold && currentSize <= MAX_STORAGE_SIZE_BYTES) {
      console.log(`Storage size (${currentSize} bytes) approaching limit, compressing...`);
      this.compressStoredData();
    }
    
    // If still exceeding limit after compression, prune old data
    const sizeAfterCompression = this.checkStorageSize();
    if (sizeAfterCompression > MAX_STORAGE_SIZE_BYTES) {
      console.log(`Storage size (${sizeAfterCompression} bytes) exceeds limit (${MAX_STORAGE_SIZE_BYTES} bytes), pruning...`);
      this.pruneOldData();
    }
  }

  /**
   * Compress stored data by removing whitespace from JSON
   * This can save significant space without losing data
   */
  private compressStoredData(): void {
    if (!this.isLocalStorageAvailable()) {
      return;
    }

    try {
      // Compress feeding history
      const feedingHistory = this.getFeedingHistory(MAX_FEEDING_RECORDS);
      if (feedingHistory.length > 0) {
        localStorage.setItem(FEEDING_HISTORY_KEY, JSON.stringify(feedingHistory));
      }

      // Compress expressions
      const expressions = this.getExpressions(MAX_EXPRESSIONS);
      if (expressions.length > 0) {
        localStorage.setItem(EXPRESSIONS_KEY, JSON.stringify(expressions));
      }

      // Compress gotchi state
      const gotchi = this.loadGotchi();
      if (gotchi) {
        localStorage.setItem(GOTCHI_KEY, JSON.stringify(gotchi));
      }

      console.log('Storage data compressed successfully');
    } catch (error) {
      console.error('Error compressing storage data:', error);
    }
  }

  /**
   * Save Gotchi state to localStorage or memory
   * Optimized: Debounced to reduce I/O operations
   * Requirements: 8.1, 8.2
   */
  saveGotchi(state: GotchiState): void {
    // Store pending state
    pendingGotchiState = state;
    
    // Use memory-only mode if localStorage is unavailable
    if (!this.isLocalStorageAvailable()) {
      memoryStorage.gotchi = state;
      return;
    }

    // Clear existing timer
    if (gotchiSaveTimer) {
      clearTimeout(gotchiSaveTimer);
    }

    // Debounce the write operation
    gotchiSaveTimer = setTimeout(() => {
      if (!pendingGotchiState) return;
      
      try {
        const serialized = JSON.stringify(pendingGotchiState);
        localStorage.setItem(GOTCHI_KEY, serialized);
        this.checkAndPruneIfNeeded();
        pendingGotchiState = null;
      } catch (error) {
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          console.error('Storage quota exceeded while saving Gotchi state');
          // Attempt to prune old data and retry
          this.pruneOldData();
          try {
            const serialized = JSON.stringify(pendingGotchiState);
            localStorage.setItem(GOTCHI_KEY, serialized);
            pendingGotchiState = null;
          } catch (retryError) {
            console.error('Failed to save Gotchi state after pruning, switching to memory-only mode');
            memoryOnlyMode = true;
            if (pendingGotchiState) {
              memoryStorage.gotchi = pendingGotchiState;
            }
            pendingGotchiState = null;
          }
        } else {
          console.error('Error saving Gotchi state, using memory-only mode:', error);
          memoryOnlyMode = true;
          if (pendingGotchiState) {
            memoryStorage.gotchi = pendingGotchiState;
          }
          pendingGotchiState = null;
        }
      }
    }, DEBOUNCE_DELAY_MS);
  }

  /**
   * Flush pending Gotchi state immediately (for critical operations)
   */
  private flushGotchiState(): void {
    if (gotchiSaveTimer) {
      clearTimeout(gotchiSaveTimer);
      gotchiSaveTimer = null;
    }
    
    if (!pendingGotchiState) return;
    
    if (!this.isLocalStorageAvailable()) {
      memoryStorage.gotchi = pendingGotchiState;
      pendingGotchiState = null;
      return;
    }

    try {
      const serialized = JSON.stringify(pendingGotchiState);
      localStorage.setItem(GOTCHI_KEY, serialized);
      pendingGotchiState = null;
    } catch (error) {
      console.error('Error flushing Gotchi state:', error);
      if (pendingGotchiState) {
        memoryStorage.gotchi = pendingGotchiState;
      }
      pendingGotchiState = null;
    }
  }

  /**
   * Load Gotchi state from localStorage or memory
   * Returns null if no state exists or if data is corrupted
   * Requirements: 8.1, 8.2
   */
  loadGotchi(): GotchiState | null {
    // Use memory-only mode if localStorage is unavailable
    if (!this.isLocalStorageAvailable()) {
      return memoryStorage.gotchi;
    }

    try {
      const serialized = localStorage.getItem(GOTCHI_KEY);
      if (!serialized) {
        return null;
      }
      
      const state = JSON.parse(serialized) as GotchiState;
      
      // Validate the loaded state
      if (!this.isValidGotchiState(state)) {
        console.error('Corrupted Gotchi state detected, clearing corrupted data');
        try {
          localStorage.removeItem(GOTCHI_KEY);
        } catch (removeError) {
          console.error('Failed to remove corrupted data:', removeError);
        }
        return null;
      }
      
      return state;
    } catch (error) {
      console.error('Error loading Gotchi state:', error);
      // Clear corrupted data
      try {
        localStorage.removeItem(GOTCHI_KEY);
      } catch (removeError) {
        console.error('Failed to remove corrupted data:', removeError);
      }
      return null;
    }
  }

  /**
   * Save a feeding record to localStorage or memory
   * Optimized: Batched writes to reduce I/O
   * Requirements: 8.3
   */
  saveFeedingRecord(record: FeedingRecord): void {
    // Add to pending batch
    pendingFeedingRecords.push(record);
    
    // Use memory-only mode if localStorage is unavailable
    if (!this.isLocalStorageAvailable()) {
      memoryStorage.feedingHistory.push(record);
      // Enforce size limit in memory
      if (memoryStorage.feedingHistory.length > MAX_FEEDING_RECORDS) {
        memoryStorage.feedingHistory = memoryStorage.feedingHistory.slice(-MAX_FEEDING_RECORDS);
      }
      pendingFeedingRecords = [];
      return;
    }

    // Clear existing timer
    if (feedingSaveTimer) {
      clearTimeout(feedingSaveTimer);
    }

    // Batch write after delay or when batch size reached
    const shouldFlushImmediately = pendingFeedingRecords.length >= BATCH_SIZE;
    
    if (shouldFlushImmediately) {
      this.flushFeedingRecords();
    } else {
      feedingSaveTimer = setTimeout(() => {
        this.flushFeedingRecords();
      }, DEBOUNCE_DELAY_MS);
    }
  }

  /**
   * Flush pending feeding records immediately
   */
  private flushFeedingRecords(): void {
    if (feedingSaveTimer) {
      clearTimeout(feedingSaveTimer);
      feedingSaveTimer = null;
    }
    
    if (pendingFeedingRecords.length === 0) return;
    
    if (!this.isLocalStorageAvailable()) {
      memoryStorage.feedingHistory.push(...pendingFeedingRecords);
      if (memoryStorage.feedingHistory.length > MAX_FEEDING_RECORDS) {
        memoryStorage.feedingHistory = memoryStorage.feedingHistory.slice(-MAX_FEEDING_RECORDS);
      }
      pendingFeedingRecords = [];
      return;
    }

    try {
      const history = this.getFeedingHistory(MAX_FEEDING_RECORDS);
      history.push(...pendingFeedingRecords);
      
      // Enforce size limit
      const trimmedHistory = history.slice(-MAX_FEEDING_RECORDS);
      
      const serialized = JSON.stringify(trimmedHistory);
      localStorage.setItem(FEEDING_HISTORY_KEY, serialized);
      this.checkAndPruneIfNeeded();
      pendingFeedingRecords = [];
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded while saving feeding records');
        this.pruneOldData();
        try {
          const history = this.getFeedingHistory(MAX_FEEDING_RECORDS);
          history.push(...pendingFeedingRecords);
          const trimmedHistory = history.slice(-MAX_FEEDING_RECORDS);
          const serialized = JSON.stringify(trimmedHistory);
          localStorage.setItem(FEEDING_HISTORY_KEY, serialized);
          pendingFeedingRecords = [];
        } catch (retryError) {
          console.error('Failed to save feeding records after pruning, switching to memory-only mode');
          memoryOnlyMode = true;
          memoryStorage.feedingHistory.push(...pendingFeedingRecords);
          pendingFeedingRecords = [];
        }
      } else {
        console.error('Error saving feeding records, using memory-only mode:', error);
        memoryOnlyMode = true;
        memoryStorage.feedingHistory.push(...pendingFeedingRecords);
        pendingFeedingRecords = [];
      }
    }
  }

  /**
   * Get feeding history from localStorage or memory
   * Requirements: 8.3, 8.4
   */
  getFeedingHistory(limit: number): FeedingRecord[] {
    // Use memory-only mode if localStorage is unavailable
    if (!this.isLocalStorageAvailable()) {
      return memoryStorage.feedingHistory.slice(-limit);
    }

    try {
      const serialized = localStorage.getItem(FEEDING_HISTORY_KEY);
      if (!serialized) {
        return [];
      }
      
      const history = JSON.parse(serialized) as FeedingRecord[];
      
      // Validate and return limited results
      if (!Array.isArray(history)) {
        console.error('Corrupted feeding history detected, clearing corrupted data');
        try {
          localStorage.removeItem(FEEDING_HISTORY_KEY);
        } catch (removeError) {
          console.error('Failed to remove corrupted data:', removeError);
        }
        return [];
      }
      
      return history.slice(-limit);
    } catch (error) {
      console.error('Error loading feeding history:', error);
      try {
        localStorage.removeItem(FEEDING_HISTORY_KEY);
      } catch (removeError) {
        console.error('Failed to remove corrupted data:', removeError);
      }
      return [];
    }
  }

  /**
   * Save an expression (art or poetry) to localStorage or memory
   * Optimized: Batched writes to reduce I/O
   * Requirements: 8.3, 8.5
   */
  saveExpression(expression: ArtExpression | PoetryExpression): void {
    // Add to pending batch
    pendingExpressions.push(expression);
    
    // Use memory-only mode if localStorage is unavailable
    if (!this.isLocalStorageAvailable()) {
      memoryStorage.expressions.push(expression);
      // Enforce size limit in memory
      if (memoryStorage.expressions.length > MAX_EXPRESSIONS) {
        memoryStorage.expressions = memoryStorage.expressions.slice(-MAX_EXPRESSIONS);
      }
      pendingExpressions = [];
      return;
    }

    // Clear existing timer
    if (expressionSaveTimer) {
      clearTimeout(expressionSaveTimer);
    }

    // Batch write after delay or when batch size reached
    const shouldFlushImmediately = pendingExpressions.length >= BATCH_SIZE;
    
    if (shouldFlushImmediately) {
      this.flushExpressions();
    } else {
      expressionSaveTimer = setTimeout(() => {
        this.flushExpressions();
      }, DEBOUNCE_DELAY_MS);
    }
  }

  /**
   * Flush pending expressions immediately
   */
  private flushExpressions(): void {
    if (expressionSaveTimer) {
      clearTimeout(expressionSaveTimer);
      expressionSaveTimer = null;
    }
    
    if (pendingExpressions.length === 0) return;
    
    if (!this.isLocalStorageAvailable()) {
      memoryStorage.expressions.push(...pendingExpressions);
      if (memoryStorage.expressions.length > MAX_EXPRESSIONS) {
        memoryStorage.expressions = memoryStorage.expressions.slice(-MAX_EXPRESSIONS);
      }
      pendingExpressions = [];
      return;
    }

    try {
      const expressions = this.getExpressions(MAX_EXPRESSIONS);
      expressions.push(...pendingExpressions);
      
      // Enforce size limit
      const trimmedExpressions = expressions.slice(-MAX_EXPRESSIONS);
      
      const serialized = JSON.stringify(trimmedExpressions);
      localStorage.setItem(EXPRESSIONS_KEY, serialized);
      this.checkAndPruneIfNeeded();
      pendingExpressions = [];
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded while saving expressions');
        this.pruneOldData();
        try {
          const expressions = this.getExpressions(MAX_EXPRESSIONS);
          expressions.push(...pendingExpressions);
          const trimmedExpressions = expressions.slice(-MAX_EXPRESSIONS);
          const serialized = JSON.stringify(trimmedExpressions);
          localStorage.setItem(EXPRESSIONS_KEY, serialized);
          pendingExpressions = [];
        } catch (retryError) {
          console.error('Failed to save expressions after pruning, switching to memory-only mode');
          memoryOnlyMode = true;
          memoryStorage.expressions.push(...pendingExpressions);
          pendingExpressions = [];
        }
      } else {
        console.error('Error saving expressions, using memory-only mode:', error);
        memoryOnlyMode = true;
        memoryStorage.expressions.push(...pendingExpressions);
        pendingExpressions = [];
      }
    }
  }

  /**
   * Get expressions from localStorage or memory
   * Requirements: 8.3, 8.5
   */
  getExpressions(limit: number): (ArtExpression | PoetryExpression)[] {
    // Use memory-only mode if localStorage is unavailable
    if (!this.isLocalStorageAvailable()) {
      return memoryStorage.expressions.slice(-limit);
    }

    try {
      const serialized = localStorage.getItem(EXPRESSIONS_KEY);
      if (!serialized) {
        return [];
      }
      
      const expressions = JSON.parse(serialized) as (ArtExpression | PoetryExpression)[];
      
      // Validate and return limited results
      if (!Array.isArray(expressions)) {
        console.error('Corrupted expressions detected, clearing corrupted data');
        try {
          localStorage.removeItem(EXPRESSIONS_KEY);
        } catch (removeError) {
          console.error('Failed to remove corrupted data:', removeError);
        }
        return [];
      }
      
      return expressions.slice(-limit);
    } catch (error) {
      console.error('Error loading expressions:', error);
      try {
        localStorage.removeItem(EXPRESSIONS_KEY);
      } catch (removeError) {
        console.error('Failed to remove corrupted data:', removeError);
      }
      return [];
    }
  }

  /**
   * Flush all pending writes immediately
   * Useful before critical operations like export/import
   */
  flushAll(): void {
    this.flushGotchiState();
    this.flushFeedingRecords();
    this.flushExpressions();
  }



  /**
   * Check current storage size in bytes
   * Requirements: 8.6
   */
  checkStorageSize(): number {
    if (!this.isLocalStorageAvailable()) {
      return 0;
    }

    let totalSize = 0;
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            // Calculate size in bytes (UTF-16 encoding)
            totalSize += key.length * 2 + value.length * 2;
          }
        }
      }
    } catch (error) {
      console.error('Error checking storage size:', error);
    }
    
    return totalSize;
  }

  /**
   * Check if storage is in memory-only mode
   */
  isMemoryOnlyMode(): boolean {
    return memoryOnlyMode;
  }

  /**
   * Prune old data to free up storage space
   * Removes oldest 20% of feeding records and expressions
   * Requirements: 8.4, 8.5, 8.6
   */
  pruneOldData(): void {
    if (!this.isLocalStorageAvailable()) {
      // Prune memory storage
      const keepFeedingCount = Math.floor(memoryStorage.feedingHistory.length * 0.8);
      memoryStorage.feedingHistory = memoryStorage.feedingHistory.slice(-keepFeedingCount);
      
      const keepExpressionCount = Math.floor(memoryStorage.expressions.length * 0.8);
      memoryStorage.expressions = memoryStorage.expressions.slice(-keepExpressionCount);
      
      console.log('Pruned old data from memory storage');
      return;
    }

    try {
      // Prune feeding history - keep newest 80%
      const feedingHistory = this.getFeedingHistory(MAX_FEEDING_RECORDS);
      const keepFeedingCount = Math.floor(feedingHistory.length * 0.8);
      const prunedFeeding = feedingHistory.slice(-keepFeedingCount);
      localStorage.setItem(FEEDING_HISTORY_KEY, JSON.stringify(prunedFeeding));
      
      // Prune expressions - keep newest 80%
      const expressions = this.getExpressions(MAX_EXPRESSIONS);
      const keepExpressionCount = Math.floor(expressions.length * 0.8);
      const prunedExpressions = expressions.slice(-keepExpressionCount);
      localStorage.setItem(EXPRESSIONS_KEY, JSON.stringify(prunedExpressions));
      
      console.log('Pruned old data to free up storage space');
    } catch (error) {
      console.error('Error pruning old data:', error);
    }
  }

  /**
   * Validate GotchiState structure
   */
  private isValidGotchiState(state: any): state is GotchiState {
    return (
      state &&
      typeof state.id === 'string' &&
      (state.stage === 1 || state.stage === 2) &&
      typeof state.feedingCount === 'number' &&
      state.emotionVector &&
      typeof state.emotionVector === 'object' &&
      typeof state.createdAt === 'number'
    );
  }


}

// Export singleton instance
export const storageService = new StorageServiceImpl();

