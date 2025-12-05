# WordGotchi Design Document

## Overview

WordGotchi is a browser-based virtual pet application that creates an emotional bond between users and an AI companion through interactive word-feeding mechanics. The system analyzes emotional content using Claude API via proxy server, generates artistic expressions via Google Gemini Imagen API via proxy server, and maintains persistent state in browser localStorage. The architecture follows a component-based React pattern with clear separation between UI, state management, and external API integrations.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Application                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Canvas     │  │    Input     │  │   Popup      │     │
│  │  Component   │  │  Component   │  │  Component   │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│  ┌──────┴──────────────────┴──────────────────┴───────┐    │
│  │           State Management (React Context)          │    │
│  └──────┬──────────────────┬──────────────────┬────────┘    │
│         │                  │                  │              │
├─────────┼──────────────────┼──────────────────┼─────────────┤
│  ┌──────┴───────┐  ┌───────┴────────┐  ┌─────┴──────┐     │
│  │   Emotion    │  │   Expression   │  │  Storage   │     │
│  │   Service    │  │    Service     │  │  Service   │     │
│  └──────┬───────┘  └───────┬────────┘  └─────┬──────┘     │
│         │                  │                  │              │
├─────────┼──────────────────┼──────────────────┼─────────────┤
│  ┌──────┴───────┐  ┌───────┴────────┐  ┌─────┴──────┐     │
│  │  Claude API  │  │  Gemini API    │  │ localStorage│     │
│  │   Client     │  │    Client      │  │             │     │
│  └──────┬───────┘  └───────┬────────┘  └─────────────┘     │
│         │                  │                                 │
├─────────┼──────────────────┼─────────────────────────────────┤
│  ┌──────┴───────┐  ┌───────┴────────┐                       │
│  │ Proxy Server │  │ Proxy Server   │                       │
│  │  (Claude)    │  │   (Gemini)     │                       │
│  └──────┬───────┘  └───────┬────────┘                       │
│         │                  │                                 │
│  ┌──────┴───────┐  ┌───────┴────────┐                       │
│  │  Claude API  │  │  Gemini Imagen │                       │
│  │   (Anthropic)│  │  API (Google)  │                       │
│  └──────────────┘  └────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

**Presentation Layer:**
- Canvas Component: Renders Gotchi character, animations, scattered words, and visual effects
- Input Component: Handles text input, character counting, and submission
- Popup Component: Displays generated art and poetry with download functionality

**State Management:**
- React Context provides global state for Gotchi data, emotion vectors, and UI state
- Custom hooks encapsulate state logic and side effects

**Service Layer:**
- Emotion Service: Interfaces with Claude API via proxy server for emotion analysis
- Expression Service: Interfaces with Claude API for poetry and Gemini Imagen API for art via proxy servers
- Storage Service: Manages localStorage operations with size limits and data migration

**External Integration:**
- Claude API Client: Handles request formatting for emotion analysis and poetry generation via proxy server
- Gemini API Client: Manages image generation requests with emotion-based prompts via proxy server
- localStorage: Browser-native persistent storage
- Proxy Servers: Handle API authentication, CORS, and request routing for both Claude and Gemini APIs

## Components and Interfaces

### Core Data Types

```typescript
// Emotion representation
interface EmotionVector {
  joy: number;        // 0-1
  sadness: number;    // 0-1
  anger: number;      // 0-1
  fear: number;       // 0-1
  surprise: number;   // 0-1
  disgust: number;    // 0-1
  trust: number;      // 0-1
  lastUpdated: number; // timestamp
}

// Gotchi state
interface GotchiState {
  id: string;
  stage: 1 | 2; // 1: Obake, 2: Furin
  feedingCount: number;
  emotionVector: EmotionVector;
  createdAt: number;
}

// Feeding record
interface FeedingRecord {
  id: string;
  timestamp: number;
  inputText: string;
  words: string[];
  emotionAnalysis: EmotionVector;
}

// Expression outputs
interface ArtExpression {
  id: string;
  timestamp: number;
  imageUrl: string;
  prompt: string;
  dominantEmotion: string;
}

interface PoetryExpression {
  id: string;
  timestamp: number;
  lines: string[];
  sourceText: string;
  emotionContext: EmotionVector;
}
```

### Service Interfaces

```typescript
// Emotion Analysis Service
interface EmotionService {
  analyzeText(text: string): Promise<EmotionVector>;
  applyDecay(vector: EmotionVector, daysSince: number): EmotionVector;
  mergeEmotions(current: EmotionVector, new: EmotionVector): EmotionVector;
  getDominantEmotion(vector: EmotionVector): string;
}

// Expression Generation Service
interface ExpressionService {
  generateArt(emotionVector: EmotionVector): Promise<ArtExpression>;
  generatePoetry(inputText: string, emotionVector: EmotionVector): Promise<PoetryExpression>;
  buildArtPrompt(emotionVector: EmotionVector): string;
}

// Storage Service
interface StorageService {
  saveGotchi(state: GotchiState): void;
  loadGotchi(): GotchiState | null;
  saveFeedingRecord(record: FeedingRecord): void;
  getFeedingHistory(limit: number): FeedingRecord[];
  saveExpression(expression: ArtExpression | PoetryExpression): void;
  getExpressions(limit: number): (ArtExpression | PoetryExpression)[];
  exportData(): string;
  importData(jsonData: string): boolean;
  checkStorageSize(): number;
  pruneOldData(): void;
}
```

### Animation System

```typescript
interface AnimationController {
  // Word feeding animations
  scatterWords(words: string[], canvasBounds: Rect): WordPosition[];
  animateWordToGotchi(word: string, from: Point, to: Point): Promise<void>;
  playEatingAnimation(): Promise<void>;
  
  // Emote animations
  playEmote(emotion: string): Promise<void>;
  
  // Gotchi idle animation
  startFloatingAnimation(): void;
  stopFloatingAnimation(): void;
  
  // Evolution animation
  playEvolutionAnimation(fromStage: number, toStage: number): Promise<void>;
  
  // Glow effects
  updateGlowEffect(emotionVector: EmotionVector): void;
}
```

## Data Models

### Gotchi Evolution Model

The Gotchi progresses through two stages in the MVP:

**Stage 1: Obake (化け)**
- Visual: Transparent white shadow, no defined form
- Capabilities: Basic emotion accumulation, color changes only
- Requirements: 0-9 feedings
- Animations: Simple floating, basic eating

**Stage 2: Furin (風鈴の音)**
- Visual: Semi-transparent with sound-wave visual effects
- Capabilities: Art generation, poetry generation, rich emotes
- Requirements: 10+ feedings
- Animations: Graceful swaying, complex emotes, enhanced glow

### Emotion Decay Model

Emotions decay exponentially over time to reflect recency:

```
decayedValue = currentValue * (0.95 ^ daysSinceLastUpdate)
```

This ensures that:
- Recent emotions have stronger influence
- Old emotions gradually fade
- The Gotchi reflects current emotional state

### Storage Data Model

localStorage structure:

```json
{
  "wordgotchi": {
    "gotchi": {
      "id": "uuid",
      "stage": 2,
      "feedingCount": 15,
      "emotionVector": {...},
      "createdAt": 1234567890
    },
    "feedingHistory": [
      {
        "id": "uuid",
        "timestamp": 1234567890,
        "inputText": "...",
        "words": ["..."],
        "emotionAnalysis": {...}
      }
    ],
    "expressions": [
      {
        "type": "art",
        "id": "uuid",
        "timestamp": 1234567890,
        "imageUrl": "data:image/png;base64,...",
        "prompt": "...",
        "dominantEmotion": "joy"
      },
      {
        "type": "poetry",
        "id": "uuid",
        "timestamp": 1234567890,
        "lines": ["...", "..."],
        "sourceText": "...",
        "emotionContext": {...}
      }
    ]
  }
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated:
- Properties 1.1 and 6.5 both test word scattering and can be combined into a single comprehensive property
- Properties 2.5, 8.1, and 9.3 all test data persistence round-tripping and can be unified
- Properties 3.1 and 4.1 test similar stage-gating logic and can be combined
- Properties 8.4 and 8.5 test the same size-limiting mechanism and can be unified

### Core Properties

**Property 1: Word decomposition and scattering**
*For any* text input, when submitted for feeding, the system should decompose it into individual words and display exactly that many scattered word elements within the Canvas Area boundaries
**Validates: Requirements 1.1, 6.5**

**Property 2: Word feeding animation completion**
*For any* scattered word, when clicked, the word should animate toward the Gotchi, trigger an eating animation, and be removed from the display
**Validates: Requirements 1.2, 1.3**

**Property 3: Emote triggering on feeding completion**
*For any* feeding session, when all words are consumed, an emotion-specific emote animation should be triggered
**Validates: Requirements 1.4**

**Property 4: Emotion analysis API integration**
*For any* text input, the system should send it to Claude API and extract seven emotion values (joy, sadness, anger, fear, surprise, disgust, trust) each between 0 and 1
**Validates: Requirements 2.1, 2.2**

**Property 5: Emotion accumulation**
*For any* new emotion analysis result, the system should merge it with the existing Emotion Vector by accumulation
**Validates: Requirements 2.3**

**Property 6: Emotion decay over time**
*For any* Emotion Vector and time period, applying decay should reduce each emotion value by 5% per day according to the formula: decayedValue = currentValue * (0.95 ^ days)
**Validates: Requirements 2.4**

**Property 7: Data persistence round-trip**
*For any* Gotchi state, saving to localStorage and then loading should produce an equivalent state with all fields preserved (evolution stage, Emotion Vector, feeding count, timestamps)
**Validates: Requirements 2.5, 8.1, 8.2, 9.3**

**Property 8: Stage-gated expression generation**
*For any* feeding session completion, if the Gotchi is at Stage 2 or higher, the system should generate both abstract art and poetry
**Validates: Requirements 3.1, 4.1**

**Property 9: Emotion-based art prompt construction**
*For any* Emotion Vector, the system should construct an art generation prompt that includes color specifications corresponding to the dominant emotion
**Validates: Requirements 3.2**

**Property 10: Expression display with download capability**
*For any* generated expression (art or poetry), the system should display it in a popup overlay and provide download/save functionality
**Validates: Requirements 3.5, 3.6, 4.4**

**Property 11: Poetry generation with correct structure**
*For any* poetry generation request, the system should send the input text and Emotion Vector to Claude API and receive a poem containing 3 to 5 lines
**Validates: Requirements 4.2, 4.3**

**Property 12: Evolution trigger at feeding threshold**
*For any* Gotchi at Stage 1, when the feeding count reaches exactly 10, the system should trigger evolution to Stage 2
**Validates: Requirements 5.3**

**Property 13: Evolution animation and capability unlock**
*For any* evolution event, the system should display the evolution animation and enable art and poetry generation capabilities for Stage 2
**Validates: Requirements 5.4, 5.5**

**Property 14: Gotchi floating animation**
*For any* time when the Gotchi is displayed, the floating animation should be active and use a sine wave function for vertical position
**Validates: Requirements 6.2, 10.5**

**Property 15: Emotion-based glow effect**
*For any* Emotion Vector with non-zero values, the system should render a glow effect around the Gotchi with colors corresponding to the dominant emotion
**Validates: Requirements 6.4**

**Property 16: Input character limit enforcement**
*For any* text input, the system should enforce a maximum of 500 characters and display the remaining character count
**Validates: Requirements 7.2, 7.3**

**Property 17: Feeding session initiation**
*For any* valid text input, clicking the submit button should initiate a feeding session with that text
**Validates: Requirements 7.4**

**Property 18: Status display accuracy**
*For any* Gotchi state, the status display should show the correct number of feedings remaining until next evolution and current emotion balance
**Validates: Requirements 7.5**

**Property 19: Feeding history persistence with size limit**
*For any* sequence of feeding sessions, the system should persist all records to localStorage and maintain a maximum of 1000 recent records by removing the oldest
**Validates: Requirements 8.3, 8.4**

**Property 20: Expression storage with size limit**
*For any* sequence of generated expressions, the system should persist all to localStorage and maintain a maximum of 500 recent items by removing the oldest
**Validates: Requirements 8.5**

**Property 21: Automatic storage pruning**
*For any* localStorage state, when data size exceeds 5MB, the system should automatically delete the oldest records to maintain the size limit
**Validates: Requirements 8.6**

**Property 22: Data export validity**
*For any* Gotchi state, exporting data should produce valid JSON that contains all Gotchi data, feeding history, and expressions
**Validates: Requirements 9.1**

**Property 23: Import validation**
*For any* JSON input, the system should validate the structure before importing, and reject invalid data while maintaining current state
**Validates: Requirements 9.2, 9.4**

**Property 24: Successful import state update**
*For any* valid imported data, the system should replace localStorage data and reload to reflect the imported Gotchi state
**Validates: Requirements 9.5**

**Property 25: Bezier curve word trajectory**
*For any* word flying toward the Gotchi, the animation path should follow a bezier curve trajectory
**Validates: Requirements 10.2**

**Property 26: Emote animation duration**
*For any* emote animation, it should complete within 2 seconds
**Validates: Requirements 10.3**

**Property 27: Popup transition effects**
*For any* popup appearance or disappearance, the system should apply fade and scale CSS transitions
**Validates: Requirements 10.4**

### Edge Case Properties

These properties ensure the system handles boundary conditions correctly:

**Edge Case 1: Empty text input handling**
*For any* empty or whitespace-only text input, the system should reject the submission and display an appropriate message

**Edge Case 2: Maximum character input**
*For any* text input of exactly 500 characters, the system should accept and process it correctly

**Edge Case 3: Single word input**
*For any* text input containing only one word, the system should handle feeding and animation correctly

**Edge Case 4: Zero emotion values**
*For any* Emotion Vector with all zero values, the system should handle display and glow effects gracefully without errors

**Edge Case 5: localStorage quota exceeded**
*For any* situation where localStorage quota is exceeded, the system should handle the error gracefully and prune data

## Error Handling

### API Error Handling

**Claude API Errors (via Proxy):**
- Network failures: Retry up to 3 times with exponential backoff (1s, 2s, 4s)
- Rate limiting: Queue requests and retry after rate limit window
- Invalid responses: Log error, display user-friendly message, use neutral emotion values as fallback
- Timeout: Set 30-second timeout, treat as network failure
- Proxy errors: Handle proxy connection failures, authentication errors

**Gemini Imagen API Errors (via Proxy):**
- Network failures: No automatic retry (user can manually retry)
- Generation failures: Display error message, allow user to retry
- Invalid image data: Log error, skip art display
- Timeout: Set 60-second timeout for image generation
- Proxy errors: Handle proxy connection failures, authentication errors
- Content policy violations: Display user-friendly message suggesting alternative text

### Storage Error Handling

**localStorage Errors:**
- Quota exceeded: Automatically prune oldest 20% of data, retry operation
- Corrupted data: Clear corrupted keys, initialize with default values
- Parse errors: Log error, treat as missing data, initialize fresh state
- Access denied: Display error message, operate in memory-only mode

### UI Error Handling

**Animation Errors:**
- Failed animation: Log error, skip to end state
- Missing elements: Gracefully degrade, continue without animation
- Performance issues: Reduce animation complexity if frame rate drops below 30fps

**Input Validation Errors:**
- Invalid characters: Strip invalid characters, process remaining text
- Oversized input: Truncate to 500 characters, display warning
- Empty input: Display inline error message, prevent submission

### Error Recovery Strategy

1. **Graceful Degradation:** System continues functioning with reduced features when non-critical errors occur
2. **User Feedback:** All errors display user-friendly messages without technical jargon
3. **Logging:** All errors logged to console with context for debugging
4. **State Preservation:** Errors during operations should not corrupt existing state
5. **Retry Mechanisms:** Transient errors automatically retried with appropriate backoff

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and integration points:

**Component Tests:**
- Canvas component renders correctly with different Gotchi stages
- Input component enforces character limits and displays counter
- Popup component displays art and poetry with download buttons
- Animation controller executes individual animations correctly

**Service Tests:**
- Emotion service correctly parses Claude API responses
- Expression service builds correct prompts for different emotions
- Storage service handles localStorage operations and size limits
- API clients format requests correctly and handle responses

**Utility Tests:**
- Text decomposition splits input into words correctly
- Emotion decay calculation produces correct values
- Dominant emotion detection identifies highest value
- Data validation functions catch invalid inputs

### Property-Based Testing

Property-based testing will verify universal properties across all inputs using **fast-check** library for TypeScript. Each property test will run a minimum of 100 iterations.

**Testing Framework:** fast-check (https://github.com/dubzzz/fast-check)

**Property Test Requirements:**
- Each property-based test MUST be tagged with a comment referencing the design document property
- Tag format: `// Feature: wordgotchi, Property {number}: {property_text}`
- Each correctness property MUST be implemented by a SINGLE property-based test
- Tests MUST run at least 100 iterations to ensure statistical confidence

**Property Test Coverage:**
- Word decomposition and scattering (Property 1)
- Word feeding animation completion (Property 2)
- Emotion analysis extraction (Property 4)
- Emotion accumulation logic (Property 5)
- Emotion decay calculation (Property 6)
- Data persistence round-trip (Property 7)
- Stage-gated expression generation (Property 8)
- Art prompt construction (Property 9)
- Evolution trigger threshold (Property 12)
- Character limit enforcement (Property 16)
- Storage size limits (Properties 19, 20, 21)
- Data export/import validity (Properties 22, 23, 24)
- Animation timing (Property 26)

**Generator Strategies:**
- Text generators: Random strings with varying lengths, special characters, unicode
- Emotion vector generators: Random values between 0-1 for all seven emotions
- Gotchi state generators: Random stages, feeding counts, timestamps
- Time delta generators: Random day counts for decay testing
- Storage data generators: Random sizes approaching and exceeding limits

### Integration Testing

Integration tests will verify end-to-end workflows:

**Feeding Workflow:**
1. User inputs text
2. Words scatter on canvas
3. User clicks words
4. Gotchi eats words
5. Emote plays
6. Expressions generate (if Stage 2)
7. Data persists

**Evolution Workflow:**
1. Gotchi starts at Stage 1
2. User completes 10 feedings
3. Evolution animation plays
4. Gotchi becomes Stage 2
5. New capabilities unlock

**Data Persistence Workflow:**
1. User interacts with Gotchi
2. Data saves to localStorage
3. User closes browser
4. User reopens application
5. State restores correctly

**Export/Import Workflow:**
1. User exports data
2. User imports data in new browser
3. Gotchi state transfers correctly

### Test Execution Strategy

1. **Unit tests** run on every code change (pre-commit hook)
2. **Property tests** run in CI/CD pipeline before merge
3. **Integration tests** run nightly and before releases
4. **Manual testing** for visual quality and user experience
5. **Performance testing** for animation frame rates and API response times

### Success Criteria

- Unit test coverage: >80% of code
- Property tests: All 27 properties passing with 100+ iterations
- Integration tests: All critical workflows passing
- No console errors during normal operation
- Smooth animations (>30fps) on target devices
- API calls complete within timeout limits
