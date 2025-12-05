// GotchiContext - React Context for managing Gotchi state
// Requirements: All

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type {
  GotchiState,
  EmotionVector,
  FeedingRecord,
  ArtExpression,
  PoetryExpression,
} from '../types';
import { storageService } from '../services/StorageService';
import { applyEmotionDecay, mergeEmotions } from '../utils';

// ============================================================================
// Types
// ============================================================================

/**
 * Context state shape
 */
interface GotchiContextState {
  gotchi: GotchiState | null;
  feedingHistory: FeedingRecord[];
  expressions: (ArtExpression | PoetryExpression)[];
  isLoading: boolean;
  isAnalyzingEmotions: boolean;
  isGeneratingArt: boolean;
  isGeneratingPoetry: boolean;
  error: string | null;
  currentFeedingWords: Array<{ word: string; x: number; y: number; id: string }>;
  currentInputText: string;
  isEvolutionAnimationPlaying: boolean;
  evolutionFromStage: number | null;
  evolutionToStage: number | null;
  currentExpression: ArtExpression | PoetryExpression | null;
}

/**
 * Context actions
 */
interface GotchiContextActions {
  feedWords: (inputText: string, words: string[], emotionAnalysis: EmotionVector) => void;
  updateEmotions: (newEmotions: EmotionVector) => void;
  evolveGotchi: () => void;
  generateExpressions: (art: ArtExpression, poetry: PoetryExpression) => void;
  clearError: () => void;
  startFeedingSession: (inputText: string, words: Array<{ word: string; x: number; y: number; id: string }>) => void;
  removeWord: (id: string) => void;
  currentFeedingWords: Array<{ word: string; x: number; y: number; id: string }>;
  completeEvolutionAnimation: () => void;
  showExpression: (expression: ArtExpression | PoetryExpression) => void;
  closeExpression: () => void;
  setGeneratingArt: (isGenerating: boolean) => void;
  setGeneratingPoetry: (isGenerating: boolean) => void;
}

/**
 * Combined context value
 */
interface GotchiContextValue extends GotchiContextState, GotchiContextActions {}

// ============================================================================
// Action Types
// ============================================================================

type GotchiAction =
  | { type: 'INITIALIZE_GOTCHI'; payload: GotchiState }
  | { type: 'FEED_WORDS'; payload: { record: FeedingRecord; updatedGotchi: GotchiState } }
  | { type: 'UPDATE_EMOTIONS'; payload: { emotionVector: EmotionVector } }
  | { type: 'START_EVOLUTION'; payload: { fromStage: number; toStage: number } }
  | { type: 'COMPLETE_EVOLUTION'; payload: { updatedGotchi: GotchiState } }
  | { type: 'ADD_EXPRESSIONS'; payload: { art: ArtExpression; poetry: PoetryExpression } }
  | { type: 'LOAD_HISTORY'; payload: { feedingHistory: FeedingRecord[]; expressions: (ArtExpression | PoetryExpression)[] } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ANALYZING_EMOTIONS'; payload: boolean }
  | { type: 'SET_GENERATING_ART'; payload: boolean }
  | { type: 'SET_GENERATING_POETRY'; payload: boolean }
  | { type: 'START_FEEDING_SESSION'; payload: { inputText: string; words: Array<{ word: string; x: number; y: number; id: string }> } }
  | { type: 'REMOVE_WORD'; payload: string }
  | { type: 'SHOW_EXPRESSION'; payload: ArtExpression | PoetryExpression }
  | { type: 'CLOSE_EXPRESSION' };

// ============================================================================
// Initial State
// ============================================================================

const initialState: GotchiContextState = {
  gotchi: null,
  feedingHistory: [],
  expressions: [],
  isLoading: true,
  isAnalyzingEmotions: false,
  isGeneratingArt: false,
  isGeneratingPoetry: false,
  error: null,
  currentFeedingWords: [],
  currentInputText: '',
  isEvolutionAnimationPlaying: false,
  evolutionFromStage: null,
  evolutionToStage: null,
  currentExpression: null,
};

// ============================================================================
// Reducer
// ============================================================================

function gotchiReducer(state: GotchiContextState, action: GotchiAction): GotchiContextState {
  switch (action.type) {
    case 'INITIALIZE_GOTCHI':
      return {
        ...state,
        gotchi: action.payload,
        isLoading: false,
      };

    case 'FEED_WORDS':
      return {
        ...state,
        gotchi: action.payload.updatedGotchi,
        feedingHistory: [...state.feedingHistory, action.payload.record],
      };

    case 'UPDATE_EMOTIONS':
      if (!state.gotchi) return state;
      return {
        ...state,
        gotchi: {
          ...state.gotchi,
          emotionVector: action.payload.emotionVector,
        },
      };

    case 'START_EVOLUTION':
      return {
        ...state,
        isEvolutionAnimationPlaying: true,
        evolutionFromStage: action.payload.fromStage,
        evolutionToStage: action.payload.toStage,
      };

    case 'COMPLETE_EVOLUTION':
      return {
        ...state,
        gotchi: action.payload.updatedGotchi,
        isEvolutionAnimationPlaying: false,
        evolutionFromStage: null,
        evolutionToStage: null,
      };

    case 'ADD_EXPRESSIONS':
      return {
        ...state,
        expressions: [...state.expressions, action.payload.art, action.payload.poetry],
      };

    case 'LOAD_HISTORY':
      return {
        ...state,
        feedingHistory: action.payload.feedingHistory,
        expressions: action.payload.expressions,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ANALYZING_EMOTIONS':
      return {
        ...state,
        isAnalyzingEmotions: action.payload,
      };

    case 'SET_GENERATING_ART':
      return {
        ...state,
        isGeneratingArt: action.payload,
      };

    case 'SET_GENERATING_POETRY':
      return {
        ...state,
        isGeneratingPoetry: action.payload,
      };

    case 'START_FEEDING_SESSION':
      return {
        ...state,
        currentFeedingWords: action.payload.words,
        currentInputText: action.payload.inputText,
      };

    case 'REMOVE_WORD':
      const updatedWords = state.currentFeedingWords.filter(w => w.id !== action.payload);
      return {
        ...state,
        currentFeedingWords: updatedWords,
        // Clear input text when all words are consumed
        currentInputText: updatedWords.length === 0 ? '' : state.currentInputText,
      };

    case 'SHOW_EXPRESSION':
      return {
        ...state,
        currentExpression: action.payload,
      };

    case 'CLOSE_EXPRESSION':
      return {
        ...state,
        currentExpression: null,
      };

    default:
      return state;
  }
}

// ============================================================================
// Context
// ============================================================================

const GotchiContext = createContext<GotchiContextValue | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

interface GotchiProviderProps {
  children: React.ReactNode;
}

export function GotchiProvider({ children }: GotchiProviderProps) {
  const [state, dispatch] = useReducer(gotchiReducer, initialState);

  // Initialize Gotchi state on mount
  useEffect(() => {
    initializeGotchi();
    
    // Flush pending writes on unmount or page unload
    const handleBeforeUnload = () => {
      storageService.flushAll();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      storageService.flushAll();
    };
  }, []);

  /**
   * Initialize Gotchi from localStorage or create new one
   * Requirements: 2.4, 2.5, 8.1
   */
  const initializeGotchi = useCallback(() => {
    try {
      // Load existing Gotchi
      let gotchi = storageService.loadGotchi();

      if (gotchi) {
        // Apply emotion decay based on time since last update
        const now = Date.now();
        const lastUpdated = gotchi.emotionVector.lastUpdated;
        const daysSince = (now - lastUpdated) / (1000 * 60 * 60 * 24);

        if (daysSince > 0) {
          const decayedEmotions = applyEmotionDecay(gotchi.emotionVector, daysSince);
          gotchi = {
            ...gotchi,
            emotionVector: decayedEmotions,
          };
          // Save updated state
          storageService.saveGotchi(gotchi);
        }
      } else {
        // Create new Gotchi at Stage 1
        gotchi = createNewGotchi();
        storageService.saveGotchi(gotchi);
      }

      dispatch({ type: 'INITIALIZE_GOTCHI', payload: gotchi });

      // Load feeding history and expressions
      const feedingHistory = storageService.getFeedingHistory(1000);
      const expressions = storageService.getExpressions(500);
      dispatch({ type: 'LOAD_HISTORY', payload: { feedingHistory, expressions } });
    } catch (error) {
      console.error('Error initializing Gotchi:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize Gotchi' });
    }
  }, []);

  /**
   * Create a new Gotchi at Stage 1
   */
  const createNewGotchi = (): GotchiState => {
    return {
      id: generateId(),
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
        lastUpdated: Date.now(),
      },
      createdAt: Date.now(),
    };
  };

  /**
   * Feed words to the Gotchi
   * Requirements: 1.1, 1.2, 1.3, 2.1, 2.3
   */
  const feedWords = (inputText: string, words: string[], emotionAnalysis: EmotionVector) => {
    if (!state.gotchi) {
      console.log('🔵 [feedWords] ❌ No gotchi found');
      return;
    }

    try {
      console.log('🔵 [feedWords] Starting feed with:', {
        inputText,
        stage: state.gotchi.stage,
        currentEmotions: state.gotchi.emotionVector,
        newEmotions: emotionAnalysis
      });

      // Merge new emotions with current emotions
      const updatedEmotions = mergeEmotions(state.gotchi.emotionVector, emotionAnalysis);
      
      console.log('🔵 [feedWords] Merged emotions:', updatedEmotions);

      // Increment feeding count
      const updatedGotchi: GotchiState = {
        ...state.gotchi,
        feedingCount: state.gotchi.feedingCount + 1,
        emotionVector: updatedEmotions,
      };

      console.log('🔵 [feedWords] Updated Gotchi:', {
        stage: updatedGotchi.stage,
        feedingCount: updatedGotchi.feedingCount,
        emotionVector: updatedGotchi.emotionVector
      });

      // Create feeding record
      const record: FeedingRecord = {
        id: generateId(),
        timestamp: Date.now(),
        inputText,
        words,
        emotionAnalysis,
      };

      // Save to localStorage
      storageService.saveGotchi(updatedGotchi);
      storageService.saveFeedingRecord(record);

      // Update state
      dispatch({ type: 'FEED_WORDS', payload: { record, updatedGotchi } });
      
      console.log('🔵 [feedWords] Feed complete, state dispatched');
    } catch (error) {
      console.error('❌ [feedWords] Error feeding words:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to feed words' });
    }
  };

  /**
   * Update Gotchi emotions
   * Requirements: 2.3
   */
  const updateEmotions = (newEmotions: EmotionVector) => {
    if (!state.gotchi) return;

    try {
      const updatedGotchi: GotchiState = {
        ...state.gotchi,
        emotionVector: newEmotions,
      };

      // Save to localStorage
      storageService.saveGotchi(updatedGotchi);

      // Update state
      dispatch({ type: 'UPDATE_EMOTIONS', payload: { emotionVector: newEmotions } });
    } catch (error) {
      console.error('Error updating emotions:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update emotions' });
    }
  };

  /**
   * Evolve Gotchi to next stage
   * Requirements: 5.3, 5.4
   */
  const evolveGotchi = () => {
    if (!state.gotchi) return;

    try {
      const fromStage = state.gotchi.stage;
      const toStage = 2; // Evolve to Stage 2

      // Start evolution animation
      dispatch({ 
        type: 'START_EVOLUTION', 
        payload: { fromStage, toStage } 
      });
    } catch (error) {
      console.error('Error evolving Gotchi:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to evolve Gotchi' });
    }
  };

  /**
   * Complete evolution animation and update Gotchi state
   * Requirements: 5.4
   */
  const completeEvolutionAnimation = () => {
    if (!state.gotchi) return;

    try {
      console.log('🟢 [completeEvolutionAnimation] Before evolution:', {
        stage: state.gotchi.stage,
        emotionVector: state.gotchi.emotionVector
      });

      // Evolve to Stage 2, preserving all other state including emotionVector
      const updatedGotchi: GotchiState = {
        ...state.gotchi,
        stage: 2,
        // Explicitly preserve emotionVector and other properties
        emotionVector: {
          ...state.gotchi.emotionVector,
          lastUpdated: Date.now(), // Update timestamp
        },
      };

      console.log('🟢 [completeEvolutionAnimation] After evolution:', {
        stage: updatedGotchi.stage,
        emotionVector: updatedGotchi.emotionVector
      });

      // Save to localStorage
      storageService.saveGotchi(updatedGotchi);

      // Update state
      dispatch({ type: 'COMPLETE_EVOLUTION', payload: { updatedGotchi } });
    } catch (error) {
      console.error('Error completing evolution:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to complete evolution' });
    }
  };

  /**
   * Add generated expressions (art and poetry)
   * Requirements: 3.1, 4.1
   */
  const generateExpressions = useCallback(
    (art: ArtExpression, poetry: PoetryExpression) => {
      try {
        // Save to localStorage
        storageService.saveExpression(art);
        storageService.saveExpression(poetry);

        // Update state
        dispatch({ type: 'ADD_EXPRESSIONS', payload: { art, poetry } });
      } catch (error) {
        console.error('Error saving expressions:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to save expressions' });
      }
    },
    []
  );

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  /**
   * Start a feeding session with scattered words
   * Requirements: 1.1, 6.5
   */
  const startFeedingSession = useCallback(
    (inputText: string, words: Array<{ word: string; x: number; y: number; id: string }>) => {
      dispatch({ type: 'START_FEEDING_SESSION', payload: { inputText, words } });
    },
    []
  );

  /**
   * Remove a word from the current feeding session
   * Requirements: 1.2, 1.3
   */
  const removeWord = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_WORD', payload: id });
  }, []);

  /**
   * Show an expression in the popup
   * Requirements: 3.5, 4.4
   */
  const showExpression = useCallback((expression: ArtExpression | PoetryExpression) => {
    dispatch({ type: 'SHOW_EXPRESSION', payload: expression });
  }, []);

  /**
   * Close the expression popup
   * Requirements: 3.5, 4.4
   */
  const closeExpression = useCallback(() => {
    dispatch({ type: 'CLOSE_EXPRESSION' });
  }, []);

  /**
   * Set art generation status
   */
  const setGeneratingArt = useCallback((isGenerating: boolean) => {
    dispatch({ type: 'SET_GENERATING_ART', payload: isGenerating });
  }, []);

  /**
   * Set poetry generation status
   */
  const setGeneratingPoetry = useCallback((isGenerating: boolean) => {
    dispatch({ type: 'SET_GENERATING_POETRY', payload: isGenerating });
  }, []);

  // Context value
  const value: GotchiContextValue = {
    ...state,
    feedWords,
    updateEmotions,
    evolveGotchi,
    generateExpressions,
    clearError,
    startFeedingSession,
    removeWord,
    completeEvolutionAnimation,
    showExpression,
    closeExpression,
    setGeneratingArt,
    setGeneratingPoetry,
  };

  return <GotchiContext.Provider value={value}>{children}</GotchiContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Custom hook to use Gotchi context
 */
export function useGotchi(): GotchiContextValue {
  const context = useContext(GotchiContext);
  if (context === undefined) {
    throw new Error('useGotchi must be used within a GotchiProvider');
  }
  return context;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
