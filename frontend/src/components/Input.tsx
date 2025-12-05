// Input Component - Text input interface for feeding the Gotchi
// Requirements: 7.1, 7.2, 7.3, 7.4, 7.5

import React, { useState, useCallback } from 'react';
import { useGotchi } from '../contexts/GotchiContext';
import { 
  decomposeTextIntoWords, 
  scatterWords, 
  getDominantEmotion,
  validateAndSanitizeInput,
  truncateText,
} from '../utils';
import { soundService } from '../services';
import './Input.css';

const MAX_CHARACTERS = 500;

export function Input() {
  const { 
    gotchi, 
    startFeedingSession,
  } = useGotchi();
  
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMuted, setIsMuted] = useState(soundService.isSoundMuted());
  const [validationError, setValidationError] = useState<string | null>(null);

  // Calculate remaining characters
  const remainingChars = MAX_CHARACTERS - inputText.length;
  
  // Check if input is valid (not empty or whitespace only)
  const isInputValid = inputText.trim().length > 0;

  /**
   * Handle text input change
   * Requirements: 7.2
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let newText = e.target.value;
    
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError(null);
    }
    
    // Truncate if exceeds maximum length
    if (newText.length > MAX_CHARACTERS) {
      newText = truncateText(newText, MAX_CHARACTERS);
    }
    
    setInputText(newText);
  }, [validationError]);

  /**
   * Handle form submission
   * Requirements: 7.4
   */
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🟤 [Input handleSubmit] Feed button clicked with text:', inputText);
    
    if (isSubmitting || !gotchi) {
      console.log('🟤 [Input handleSubmit] ❌ Early return:', { isSubmitting, hasGotchi: !!gotchi });
      return;
    }

    // Validate and sanitize input
    const validation = validateAndSanitizeInput(inputText, MAX_CHARACTERS);
    
    if (!validation.valid) {
      console.log('🟤 [Input handleSubmit] ❌ Validation failed:', validation.error);
      setValidationError(validation.error || 'Invalid input');
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    try {
      // Use sanitized text
      const textToFeed = validation.sanitized;
      
      console.log('🟤 [Input handleSubmit] Sanitized text:', textToFeed);
      
      // Decompose text into words
      const words = decomposeTextIntoWords(textToFeed);
      
      console.log('🟤 [Input handleSubmit] Decomposed words:', words);
      
      // Check if we have any words after decomposition
      if (words.length === 0) {
        setValidationError('No valid words found in input');
        setIsSubmitting(false);
        return;
      }
      
      // Scatter words on canvas (assuming canvas dimensions)
      const canvasWidth = window.innerWidth;
      const canvasHeight = 400; // Canvas height from requirements
      const scatteredWords = scatterWords(words, canvasWidth, canvasHeight);
      
      // Add unique IDs to words
      const wordsWithIds = scatteredWords.map((wordPos, index) => ({
        ...wordPos,
        id: `word-${Date.now()}-${index}`,
      }));
      
      console.log('🟤 [Input handleSubmit] Starting feeding session with', wordsWithIds.length, 'words');
      
      // Start feeding session with input text
      startFeedingSession(textToFeed, wordsWithIds);
      
      // Clear input field
      setInputText('');
    } catch (error) {
      console.error('❌ [Input handleSubmit] Error starting feeding session:', error);
      setValidationError('Failed to start feeding session. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [inputText, isSubmitting, gotchi, startFeedingSession]);

  /**
   * Calculate feedings remaining until next evolution
   * Requirements: 7.5
   */
  const getFeedingsRemaining = (): number => {
    if (!gotchi) return 10;
    
    if (gotchi.stage === 1) {
      return Math.max(0, 10 - gotchi.feedingCount);
    }
    
    return 0; // No more evolutions after Stage 2
  };

  /**
   * Get current emotion balance display
   * Requirements: 7.5
   */
  const getEmotionBalance = (): string => {
    if (!gotchi) return 'Neutral';
    
    console.log('🟠 [Input] Current gotchi emotion vector:', gotchi.emotionVector);
    
    const dominantEmotion = getDominantEmotion(gotchi.emotionVector);
    const emotionValue = gotchi.emotionVector[dominantEmotion as keyof typeof gotchi.emotionVector];
    
    console.log('🟠 [Input] Dominant emotion:', dominantEmotion, 'Value:', emotionValue);
    
    // Format emotion name (capitalize first letter)
    const formattedEmotion = dominantEmotion.charAt(0).toUpperCase() + dominantEmotion.slice(1);
    
    // Show percentage
    const percentage = Math.round((emotionValue as number) * 100);
    
    const displayText = `${formattedEmotion} (${percentage}%)`;
    console.log('🟠 [Input] Displaying:', displayText);
    
    return displayText;
  };

  /**
   * Toggle sound mute
   */
  const toggleMute = useCallback(() => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    soundService.setMuted(newMutedState);
    
    // Play a click sound to confirm (if unmuting)
    if (!newMutedState) {
      soundService.playClickSound();
    }
  }, [isMuted]);



  if (!gotchi) {
    return null;
  }

  const feedingsRemaining = getFeedingsRemaining();
  const emotionBalance = getEmotionBalance();

  return (
    <div className="input-container">
      {/* Status Display */}
      <div className="input-status">
        <div>
          <strong>Stage:</strong> {gotchi.stage === 1 ? 'Obake' : 'Boofer'}
          {gotchi.stage === 1 && (
            <span style={{ marginLeft: '16px' }}>
              <strong>Feedings until evolution:</strong> {feedingsRemaining}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <strong>Emotion:</strong> {emotionBalance}
          </div>
          <button
            type="button"
            onClick={toggleMute}
            className="sound-toggle-button"
            title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="input-form">
        <textarea
          value={inputText}
          onChange={handleInputChange}
          placeholder="Feed your Gotchi with words..."
          disabled={isSubmitting}
          className={`input-textarea ${validationError ? 'error' : ''}`}
        />
        <div className="input-info-row">
          <div className={`input-char-count ${remainingChars < 50 ? 'warning' : ''}`}>
            {remainingChars} characters remaining
          </div>
          {validationError && (
            <div className="input-error-message">
              {validationError}
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={!isInputValid || isSubmitting}
          className="input-submit-button"
        >
          {isSubmitting ? 'Feeding...' : 'Feed'}
        </button>
      </form>
    </div>
  );
}
