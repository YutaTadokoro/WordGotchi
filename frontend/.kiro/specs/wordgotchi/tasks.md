# Implementation Plan

- [x] 1. Set up project structure and dependencies





  - Initialize React + TypeScript project with Vite
  - Install dependencies: framer-motion, konva, react-konva, fast-check
  - Configure TypeScript with strict mode
  - Set up project folder structure (components, services, types, utils)
  - _Requirements: All_

- [x] 2. Implement core data types and models





  - [x] 2.1 Create TypeScript interfaces for core data types


    - Define EmotionVector, GotchiState, FeedingRecord, ArtExpression, PoetryExpression interfaces
    - Define service interfaces (EmotionService, ExpressionService, StorageService)
    - Define AnimationController interface
    - _Requirements: 2.1, 2.2, 2.3, 8.1, 8.2_
  
  - [ ]* 2.2 Write property test for emotion decay calculation
    - **Property 6: Emotion decay over time**
    - **Validates: Requirements 2.4**
  
  - [x] 2.3 Implement emotion utility functions


    - Create emotion decay calculation function
    - Create emotion merge/accumulation function
    - Create dominant emotion detection function
    - _Requirements: 2.3, 2.4_
  
  - [ ]* 2.4 Write property test for emotion accumulation
    - **Property 5: Emotion accumulation**
    - **Validates: Requirements 2.3**

- [x] 3. Implement Storage Service





  - [x] 3.1 Create localStorage wrapper with error handling


    - Implement saveGotchi, loadGotchi functions
    - Implement saveFeedingRecord, getFeedingHistory functions
    - Implement saveExpression, getExpressions functions
    - Add error handling for quota exceeded and corrupted data
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [ ]* 3.2 Write property test for data persistence round-trip
    - **Property 7: Data persistence round-trip**
    - **Validates: Requirements 2.5, 8.1, 8.2, 9.3**
  
  - [x] 3.3 Implement storage size management


    - Create checkStorageSize function
    - Create pruneOldData function with 1000 feeding limit and 500 expression limit
    - Implement automatic pruning when exceeding 5MB
    - _Requirements: 8.4, 8.5, 8.6_
  
  - [ ]* 3.4 Write property tests for storage size limits
    - **Property 19: Feeding history persistence with size limit**
    - **Property 20: Expression storage with size limit**
    - **Property 21: Automatic storage pruning**
    - **Validates: Requirements 8.3, 8.4, 8.5, 8.6**
  
  - [x] 3.5 Implement export and import functionality


    - Create exportData function that generates JSON
    - Create importData function with validation
    - Add error handling for invalid imports
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ]* 3.6 Write property tests for export/import
    - **Property 22: Data export validity**
    - **Property 23: Import validation**
    - **Property 24: Successful import state update**
    - **Validates: Requirements 9.1, 9.2, 9.4, 9.5**

- [x] 4. Implement API clients





  - [x] 4.1 Create Claude API client for emotion analysis


    - Implement API request formatting
    - Add authentication handling
    - Implement retry logic with exponential backoff
    - Add 30-second timeout
    - Parse response to extract seven emotion values
    - _Requirements: 2.1, 2.2_
  
  - [ ]* 4.2 Write property test for emotion analysis extraction
    - **Property 4: Emotion analysis API integration**
    - **Validates: Requirements 2.1, 2.2**
  
  - [x] 4.3 Create Claude API client for poetry generation

    - Implement poetry generation request formatting
    - Add retry logic and timeout
    - Parse response to extract 3-5 line poems
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ]* 4.4 Write property test for poetry structure validation
    - **Property 11: Poetry generation with correct structure**
    - **Validates: Requirements 4.2, 4.3**
  
  - [x] 4.5 Create Stable Diffusion API client


    - Implement image generation request formatting
    - Add retry logic with 2-second delay
    - Add 60-second timeout
    - Handle image data response
    - _Requirements: 3.1_

- [x] 5. Implement Expression Service





  - [x] 5.1 Create art prompt builder


    - Implement buildArtPrompt function that maps emotions to colors
    - Map joy to golden and bright colors
    - Map sadness to blue and purple deep tones
    - Map other emotions to appropriate color palettes
    - _Requirements: 3.2, 3.3, 3.4_
  
  - [ ]* 5.2 Write property test for art prompt construction
    - **Property 9: Emotion-based art prompt construction**
    - **Validates: Requirements 3.2**
  
  - [x] 5.3 Implement generateArt function

    - Integrate with Stable Diffusion API client
    - Build prompt from emotion vector
    - Return ArtExpression object
    - _Requirements: 3.1, 3.2_
  
  - [x] 5.4 Implement generatePoetry function

    - Integrate with Claude API client
    - Send input text and emotion vector
    - Return PoetryExpression object
    - _Requirements: 4.1, 4.2_

- [x] 6. Implement React Context for state management




  - [x] 6.1 Create GotchiContext with state and actions


    - Define context shape with GotchiState, feeding history, expressions
    - Implement useGotchi hook
    - Add actions: feedWords, updateEmotions, evolveGotchi, generateExpressions
    - _Requirements: All_
  
  - [x] 6.2 Implement state initialization and persistence


    - Load Gotchi state from localStorage on mount
    - Apply emotion decay based on time since last update
    - Save state changes to localStorage automatically
    - _Requirements: 2.4, 2.5, 8.1_
  
  - [ ]* 6.3 Write property test for evolution trigger
    - **Property 12: Evolution trigger at feeding threshold**
    - **Validates: Requirements 5.3**

- [x] 7. Implement Canvas Component with Konva





  - [x] 7.1 Create basic Canvas component structure


    - Set up Konva Stage with 400px height and full width
    - Implement gradient background (deep purple to black)
    - Add Gotchi character layer
    - Add words layer for scattered words
    - Add effects layer for glow
    - _Requirements: 6.1, 6.3_
  
  - [x] 7.2 Implement Gotchi character rendering


    - Create Stage 1 (Obake) visual: transparent white shadow
    - Create Stage 2 (Furin) visual: semi-transparent with sound waves
    - Implement stage-based rendering logic
    - _Requirements: 5.1, 5.2_
  
  - [x] 7.3 Implement floating animation


    - Use sine wave function for vertical position
    - Apply smooth easing with Framer Motion
    - Keep animation running while Gotchi is displayed
    - _Requirements: 6.2, 10.5_
  
  - [ ]* 7.4 Write property test for floating animation
    - **Property 14: Gotchi floating animation**
    - **Validates: Requirements 6.2, 10.5**
  
  - [x] 7.5 Implement emotion-based glow effect


    - Calculate glow color from dominant emotion
    - Render glow around Gotchi character
    - Update glow when emotion vector changes
    - _Requirements: 6.4_
  
  - [ ]* 7.6 Write property test for glow effect
    - **Property 15: Emotion-based glow effect**
    - **Validates: Requirements 6.4**

- [x] 8. Implement word feeding mechanics




  - [x] 8.1 Create text decomposition utility


    - Split input text into individual words
    - Filter out empty strings
    - Return array of words
    - _Requirements: 1.1_
  
  - [ ]* 8.2 Write property test for word decomposition
    - **Property 1: Word decomposition and scattering**
    - **Validates: Requirements 1.1, 6.5**
  
  - [x] 8.3 Implement word scattering logic


    - Generate random positions within Canvas Area bounds
    - Ensure words don't overlap
    - Display words as Konva Text elements
    - _Requirements: 1.1, 6.5_
  
  - [x] 8.4 Implement word click handling


    - Add click event listeners to scattered words
    - Trigger word-to-Gotchi animation on click
    - Remove word from display after animation
    - _Requirements: 1.2, 1.3_
  
  - [ ]* 8.5 Write property test for word feeding animation
    - **Property 2: Word feeding animation completion**
    - **Validates: Requirements 1.2, 1.3**

- [x] 9. Implement animation system





  - [x] 9.1 Create AnimationController class


    - Implement animateWordToGotchi with bezier curve trajectory
    - Implement playEatingAnimation
    - Implement playEmote with emotion-specific animations
    - Implement playEvolutionAnimation
    - _Requirements: 1.2, 1.3, 1.4, 5.4_
  
  - [ ]* 9.2 Write property test for bezier trajectory
    - **Property 25: Bezier curve word trajectory**
    - **Validates: Requirements 10.2**
  
  - [x] 9.3 Implement emote animations


    - Create joy emote: jumping animation
    - Create sadness emote: sinking animation
    - Create anger emote: shaking animation
    - Create other emotion emotes
    - Ensure all emotes complete within 2 seconds
    - _Requirements: 1.4, 1.5, 10.3_
  
  - [ ]* 9.4 Write property test for emote duration
    - **Property 26: Emote animation duration**
    - **Validates: Requirements 10.3**
  
  - [x] 9.5 Implement evolution animation


    - Create screen-wide light effect
    - Add Japanese-style background music
    - Display evolution message
    - Transition from Stage 1 to Stage 2 visual
    - _Requirements: 5.4_
  
  - [ ]* 9.6 Write property test for emote triggering
    - **Property 3: Emote triggering on feeding completion**
    - **Validates: Requirements 1.4**

- [x] 10. Implement Input Component





  - [x] 10.1 Create input form with character limit


    - Add textarea with 500 character maximum
    - Display remaining character count
    - Add submit button
    - Disable submit for empty input
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [ ]* 10.2 Write property test for character limit
    - **Property 16: Input character limit enforcement**
    - **Validates: Requirements 7.2, 7.3**
  
  - [x] 10.3 Implement feeding session initiation

    - Handle submit button click
    - Pass input text to GotchiContext
    - Clear input field after submission
    - _Requirements: 7.4_
  
  - [ ]* 10.4 Write property test for feeding initiation
    - **Property 17: Feeding session initiation**
    - **Validates: Requirements 7.4**
  
  - [x] 10.5 Implement status display

    - Show feedings remaining until next evolution
    - Display current emotion balance
    - Update in real-time as state changes
    - _Requirements: 7.5_
  
  - [ ]* 10.6 Write property test for status display
    - **Property 18: Status display accuracy**
    - **Validates: Requirements 7.5**

- [-] 11. Implement Popup Component for expressions


  - [x] 11.1 Create popup overlay structure


    - Center popup on Canvas Area
    - Add fade and scale transitions
    - Implement close button
    - _Requirements: 3.5, 4.4, 10.4_
  
  - [ ]* 11.2 Write property test for popup transitions
    - **Property 27: Popup transition effects**
    - **Validates: Requirements 10.4**
  
  - [x] 11.3 Implement art display

    - Display generated artwork image
    - Add download button
    - Add save to gallery button
    - _Requirements: 3.5, 3.6_
  
  - [ ]* 11.4 Write property test for expression display
    - **Property 10: Expression display with download capability**
    - **Validates: Requirements 3.5, 3.6, 4.4**
  
  - [x] 11.5 Implement poetry display


    - Display poem lines with formatting
    - Add copy button
    - Add save button
    - _Requirements: 4.4_

- [-] 12. Implement feeding workflow integration


  - [x] 12.1 Connect feeding flow from input to expressions



    - Wire input submission to word scattering
    - Connect word clicks to animations
    - Trigger emotion analysis after all words consumed
    - Update Gotchi state with new emotions
    - Trigger expression generation for Stage 2 Gotchis
    - Display expressions in popup
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.3, 3.1, 4.1_
  
  - [ ]* 12.2 Write property test for stage-gated expression generation
    - **Property 8: Stage-gated expression generation**
    - **Validates: Requirements 3.1, 4.1**
  
  - [ ]* 12.3 Write property test for evolution capability unlock
    - **Property 13: Evolution animation and capability unlock**
    - **Validates: Requirements 5.4, 5.5**

- [x] 13. Implement evolution system




  - [x] 13.1 Add evolution check after each feeding


    - Check if feeding count reaches 10 at Stage 1
    - Trigger evolution animation
    - Update Gotchi to Stage 2
    - Enable art and poetry generation
    - Persist new stage to localStorage
    - _Requirements: 5.3, 5.4, 5.5_

- [x] 14. Add visual polish and styling




  - [x] 14.1 Apply color palette throughout UI


    - Use deep purple (#0a0014), ether purple (#1a0f2e), soul lavender (#b794f6), ghost white (#e8d5ff)
    - Style input area with theme colors
    - Style popups with theme colors
    - _Requirements: 6.3_
  
  - [x] 14.2 Add pixel font for retro elements


    - Load Press Start 2P font
    - Apply to Gotchi-related text
    - Use Inter font for body text
    - _Requirements: UI/UX_
  
  - [x] 14.3 Add sound effects


    - Add eating sound effect
    - Add evolution music
    - Add ambient background music (optional)
    - _Requirements: 5.4_
-

- [x] 15. Implement error handling




  - [x] 15.1 Add API error handling


    - Implement retry logic for Claude API
    - Implement retry logic for Stable Diffusion API
    - Display user-friendly error messages
    - Use fallback neutral emotions on API failure
    - _Requirements: Error Handling_
  
  - [x] 15.2 Add storage error handling


    - Handle localStorage quota exceeded
    - Handle corrupted data
    - Implement graceful degradation to memory-only mode
    - _Requirements: Error Handling_
  
  - [x] 15.3 Add input validation


    - Reject empty or whitespace-only input
    - Truncate oversized input
    - Strip invalid characters
    - _Requirements: Error Handling_

- [x] 16. Add export/import UI




  - [x] 16.1 Create export button and functionality


    - Add export button to UI
    - Generate JSON file on click
    - Trigger download
    - _Requirements: 9.1_
  
  - [x] 16.2 Create import button and functionality

    - Add import button to UI
    - Handle file selection
    - Validate imported data
    - Display success/error messages
    - Reload application after successful import
    - _Requirements: 9.2, 9.3, 9.4, 9.5_

- [x] 17. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 18. Performance optimization




  - [x] 18.1 Optimize Canvas rendering


    - Implement layer caching for static elements
    - Reduce unnecessary re-renders
    - Optimize animation frame rate
    - _Requirements: Performance_
  
  - [x] 18.2 Optimize localStorage operations


    - Batch writes to reduce I/O
    - Debounce frequent updates
    - Compress data if approaching size limits
    - _Requirements: Performance_

- [x] 19. Final integration and polish





  - [x] 19.1 Test complete user workflows


    - Test first-time user experience
    - Test feeding workflow from start to finish
    - Test evolution workflow
    - Test export/import workflow
    - _Requirements: All_
  
  - [x] 19.2 Add loading states and transitions


    - Show loading indicator during API calls
    - Add skeleton screens for initial load
    - Smooth transitions between states
    - _Requirements: UX_
  
  - [x] 19.3 Add responsive design


    - Ensure Canvas scales properly on different screen sizes
    - Make input area responsive
    - Test on mobile devices
    - _Requirements: UX_

- [x] 20. Final Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.
