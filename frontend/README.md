# WordGotchi

WordGotchi is a virtual pet application that grows by consuming words. It provides an interactive experience combining emotion analysis and AI-generated art.

## Features

- 📝 **Interactive Word Feeding**: Input text is decomposed into individual words that you can click to feed to your Gotchi
- 🧠 **Emotion Analysis**: Analyzes seven basic emotions (joy, sadness, anger, fear, surprise, disgust, trust) using Claude API
- 🎨 **Emotion-Based Art Generation**: Generates abstract art from accumulated emotions using Google Gemini Imagen API
- 📜 **Poetry Generation**: Automatically generates poetry from input text and emotional state
- 🌱 **Two-Stage Evolution System**: 
- ✨ **Rich Animations**: 
  - Bezier curve trajectories for flying words
  - Gotchi floating animation
  - Emotion-specific emote animations
  - Special effects during evolution
- 🌈 **Emotion Glow Effect**: A colored glow appears around the Gotchi corresponding to the dominant emotion

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and configure the required API keys:

```bash
cp .env.example .env
```

#### Claude API Configuration

Uses Claude API for emotion analysis via proxy server:

```env
VITE_CLAUDE_PROXY_TARGET=http://127.0.0.1:8000
```

**Proxy Server Responsibilities:**
- Claude API key management
- Adding authentication headers
- Building API endpoints

**Note**: Claude API keys are managed on the proxy server side. Do not include API keys directly in the frontend.

#### Gemini API Configuration

Uses Google Gemini Imagen API for art generation via proxy server:

```env
VITE_GEMINI_PROXY_TARGET=http://127.0.0.1:8000
```


### 3. Start Development Server

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### 4. Build

```bash
npm run build
```

## Usage

1. **Text Input**: Enter words in the text box (maximum 500 characters)
2. **Word Scattering**: Upon submission, input text is decomposed into individual words and scattered across the canvas area
3. **Feeding**: Click on scattered words to make them fly toward the Gotchi
4. **Emotion Analysis**: When the Gotchi eats words, emotions are analyzed and accumulated
5. **Emotes**: When all words are consumed, an emote animation plays based on the emotion
6. **Evolution**: After 10 feedings, the Gotchi evolves to Stage 2 with a special evolution animation and Japanese-style background music
7. **Expression Generation**: From Stage 2 onwards, emotion-based art and poetry are automatically generated with each feeding
8. **Save Works**: Generated art and poetry can be downloaded and saved

### Emotion System

- **Seven Basic Emotions**: Joy, sadness, anger, fear, surprise, disgust, trust
- **Emotion Accumulation**: Emotions accumulate with each feeding
- **Emotion Decay**: Emotions gradually fade over time (5% per day)
- **Glow Effect**: A colored glow appears around the Gotchi corresponding to the dominant emotion

### Data Management

- **Auto-Save**: All state changes are automatically saved to localStorage
- **Export**: Export Gotchi data in JSON format
- **Import**: Import data from other browsers or devices
- **Capacity Management**: When storage exceeds 5MB, old data is automatically deleted

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: CSS
- **Animation**: 
  - Framer Motion (UI animations)
  - Konva + React Konva (canvas animations)
- **AI APIs**: 
  - Claude API (emotion analysis, poetry generation)
  - Google Gemini Imagen API (image generation)
- **Storage**: LocalStorage
- **Testing**: 
  - Vitest (unit tests, integration tests)
  - fast-check (property-based testing)
  - Testing Library (component tests)

## Project Structure

```
src/
├── components/     # UI components
│   ├── Canvas.tsx              # Main canvas area
│   ├── GotchiCharacter.tsx     # Gotchi character
│   ├── Input.tsx               # Text input component
│   ├── Popup.tsx               # Art/poetry display popup
│   ├── EvolutionAnimation.tsx  # Evolution animation
│   ├── GlowEffect.tsx          # Emotion glow effect
│   ├── ScatteredWord.tsx       # Scattered words
│   └── ...
├── contexts/       # React Context
│   └── GotchiContext.tsx       # Global state management
├── services/       # API clients and business logic
│   ├── ClaudeAPIClient.ts      # Claude API integration
│   ├── GeminiClient.ts         # Gemini Imagen API integration
│   ├── ExpressionService.ts    # Art/poetry generation service
│   ├── StorageService.ts       # localStorage management
│   ├── AnimationController.ts  # Animation control
│   └── SoundService.ts         # Sound management
├── types/          # TypeScript type definitions
│   └── index.ts                # Common type definitions
├── utils/          # Utility functions
└── integration/    # Integration tests
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test -- --coverage
```

### Testing Strategy

- **Unit Tests**: Verify behavior of individual components and services
- **Property-Based Tests**: Use fast-check to verify universal properties across 100+ random inputs
- **Integration Tests**: Verify end-to-end workflows (feeding, evolution, data persistence, etc.)
- **Component Tests**: Use Testing Library to verify UI component behavior

### Test Coverage Goals

- Unit test coverage: >80%
- Property tests: All 27 correctness properties passing with 100+ iterations
- Integration tests: All critical workflows passing

## Development

### Code Quality

```bash
# Lint check
npm run lint

# Build check
npm run build
```

### Architecture

WordGotchi consists of the following layers:

1. **Presentation Layer**: React components (Canvas, Input, Popup)
2. **State Management Layer**: Global state management via React Context
3. **Service Layer**: Business logic and external API integration
4. **Storage Layer**: Data persistence via LocalStorage

See `.kiro/specs/wordgotchi/design.md` for detailed design documentation.

## Troubleshooting

### API Errors

- **Claude API**: Network errors are retried up to 3 times with exponential backoff
- **Gemini Imagen API**: Generation errors display a retry option to the user (timeout: 60 seconds)


### Storage Errors

- **Quota Exceeded**: Automatically deletes 20% of old data and retries the operation
- **Corrupted Data**: Corrupted keys are cleared and initialized with default values

### Performance

- When animation frame rate drops below 30fps, complexity is automatically reduced

## License

MIT
