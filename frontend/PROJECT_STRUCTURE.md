# WordGotchi Project Structure

## Overview
WordGotchi is a React + TypeScript application built with Vite. The project follows a component-based architecture with clear separation of concerns.

## Directory Structure

```
frontend/
├── .kiro/                    # Kiro specs and configuration
│   └── specs/wordgotchi/    # Feature specifications
├── src/
│   ├── components/          # React components (Canvas, Input, Popup)
│   ├── services/            # Service layer (API clients, business logic)
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions and helpers
│   ├── assets/              # Static assets (images, fonts)
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles
├── public/                  # Public static files
├── node_modules/            # Dependencies
├── package.json             # Project dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite build configuration
└── vitest.config.ts         # Vitest test configuration
```

## Key Dependencies

### Production Dependencies
- **react** (^19.2.0): UI library
- **react-dom** (^19.2.0): React DOM renderer
- **framer-motion** (^12.23.24): Animation library
- **konva** (^10.0.12): Canvas library for 2D graphics
- **react-konva** (^19.2.1): React bindings for Konva

### Development Dependencies
- **typescript** (~5.9.3): Type-safe JavaScript
- **vite** (^7.2.4): Build tool and dev server
- **vitest** (^4.0.14): Testing framework
- **fast-check** (^4.3.0): Property-based testing library
- **happy-dom** (^16.14.0): DOM implementation for testing
- **@testing-library/react** (^16.1.0): React testing utilities
- **eslint**: Code linting

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm test` - Run tests once
- `npm run test:watch` - Run tests in watch mode

## TypeScript Configuration

The project uses strict TypeScript configuration with:
- Strict mode enabled
- No unused locals/parameters
- ES2022 target
- React JSX transform

## Testing Setup

- **Framework**: Vitest with happy-dom environment
- **Property-Based Testing**: fast-check library
- **Component Testing**: @testing-library/react
- **Minimum PBT iterations**: 100 per property test

## Architecture Layers

1. **Presentation Layer**: React components for UI
2. **State Management**: React Context for global state
3. **Service Layer**: Business logic and API integration
4. **Data Layer**: localStorage for persistence

## Next Steps

Refer to `.kiro/specs/wordgotchi/tasks.md` for the implementation plan.
