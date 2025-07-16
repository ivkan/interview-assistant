# Contributing to Interview Assistant

## 🎯 Development Guide

Thank you for your interest in contributing to Interview Assistant! This guide will help you get started with development and understand the project structure.

## 📋 Prerequisites

- **Node.js 18+** with pnpm
- **TypeScript** knowledge
- **React** and **Electron** experience
- **API Keys** for testing:
  - OpenAI or DeepSeek (required)
  - Google Cloud (optional for Speech-to-Text)

## 🚀 Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd interview-assistant

# Install dependencies
pnpm install

# Set up environment
cp .env.test .env
# Add your API keys to .env

# Start development
pnpm run dev

# Run tests
pnpm run typecheck
node test-complete-system.js
```

## 🏗️ Project Architecture

### Directory Structure
```
src/
├── main/                    # Electron main process
│   ├── index.ts            # App initialization
│   ├── audio/              # Audio capture & processing
│   │   └── audioCapture.ts
│   └── ipc/                # Inter-process communication
│       └── handlers.ts
├── renderer/               # React application
│   ├── components/         # UI components
│   │   ├── ui/            # Base shadcn/ui components
│   │   ├── Settings/      # Settings modal components
│   │   ├── Toolbar/       # Application toolbar
│   │   ├── TranscriptColumn/
│   │   ├── ResponseColumn/
│   │   └── HistoryColumn/
│   ├── hooks/             # Custom React hooks
│   │   ├── useAudioCapture.ts
│   │   ├── useSpeechToText.ts
│   │   ├── useQuestionDetection.ts
│   │   └── useAIResponse.ts
│   ├── services/          # API integrations
│   │   ├── speechToText.ts
│   │   ├── aiResponse.ts
│   │   └── questionDetection.ts
│   ├── store/             # State management
│   │   ├── interviewStore.ts
│   │   └── settingsStore.ts
│   ├── types/             # TypeScript definitions
│   └── utils/             # Helper functions
└── shared/                # Shared types/constants
```

### Key Technologies
- **Frontend**: React 18 + TypeScript
- **UI Library**: shadcn/ui + Tailwind CSS
- **Desktop**: Electron
- **State**: Zustand
- **Build**: Vite + esbuild
- **Speech**: Google Cloud Speech-to-Text API
- **AI**: OpenAI GPT-4o-mini / DeepSeek

## 🔧 Development Workflow

### 1. Code Style
```bash
# Lint code
pnpm run lint

# Fix linting issues
pnpm run lint:fix

# Type checking
pnpm run typecheck
```

### 2. Testing Strategy
- **Unit Testing**: Jest (to be added)
- **Integration Testing**: Manual testing with real APIs
- **E2E Testing**: Full interview simulation

### 3. Building
```bash
# Development build
pnpm run build:main
pnpm run build:vite

# Production build
pnpm run build

# Distribution build
pnpm run build:electron
```

## 🧩 Component Development

### Creating New Components

1. **Use shadcn/ui base components**:
   ```tsx
   import { Button } from '../ui/button'
   import { Input } from '../ui/input'
   ```

2. **Follow naming conventions**:
   - PascalCase for components
   - camelCase for functions/variables
   - SCREAMING_SNAKE_CASE for constants

3. **Include TypeScript interfaces**:
   ```tsx
   interface MyComponentProps {
     title: string
     onAction: () => void
   }
   
   export function MyComponent({ title, onAction }: MyComponentProps) {
     // Component logic
   }
   ```

### State Management

Use Zustand stores for global state:

```tsx
import { create } from 'zustand'

interface MyState {
  data: string[]
  addItem: (item: string) => void
}

export const useMyStore = create<MyState>((set) => ({
  data: [],
  addItem: (item) => set((state) => ({ 
    data: [...state.data, item] 
  }))
}))
```

## 🔌 API Integration

### Adding New AI Providers

1. **Extend AIProvider interface** in `src/renderer/services/aiResponse.ts`
2. **Implement provider-specific logic**
3. **Add to settings configuration**
4. **Update UI for selection**

### Audio Processing

Audio flows through these stages:
```
Microphone → Web Audio API → Float32Array → IPC → Speech-to-Text → Transcript
```

Key files:
- `src/main/audio/audioCapture.ts` - Electron audio permissions
- `src/renderer/services/audioCapture.ts` - Web Audio API
- `src/renderer/hooks/useAudioCapture.ts` - React integration

### Question Detection

The detection algorithm uses multiple strategies:
- Pattern matching (question words, punctuation)
- Interview-specific patterns (behavioral, technical)
- Context analysis (multiple sentences)
- Confidence scoring (0-1 range)

Extend patterns in `src/renderer/services/questionDetection.ts`.

## 🎨 UI Development

### Design System

- **Colors**: CSS variables with light/dark theme support
- **Spacing**: Tailwind spacing scale (4px increments)
- **Typography**: System fonts with consistent sizing
- **Icons**: Lucide React icons

### Responsive Design

The app is designed for desktop (1200px+ width) but should handle:
- Minimum window size: 1200x700
- Maximum window size: Full screen
- Column resizing (future enhancement)

### Accessibility

- Keyboard navigation support
- Screen reader compatible
- High contrast themes
- Clear focus indicators

## 🧪 Testing Guidelines

### Manual Testing Checklist

1. **Audio Capture**:
   - [ ] Microphone permissions granted
   - [ ] Audio levels visible
   - [ ] Multiple device support

2. **Transcription**:
   - [ ] Real-time text appears
   - [ ] Partial vs final transcripts
   - [ ] Language accuracy

3. **Question Detection**:
   - [ ] Automatic detection works
   - [ ] Manual override (Ctrl+Shift+Q)
   - [ ] Different question types

4. **AI Responses**:
   - [ ] Response generation starts
   - [ ] Streaming text display
   - [ ] Context awareness
   - [ ] Error handling

5. **Settings**:
   - [ ] API key management
   - [ ] User profile updates
   - [ ] Audio/transcription settings

6. **History**:
   - [ ] Interview saving
   - [ ] History navigation
   - [ ] Data persistence

### Performance Testing

Monitor these metrics during development:
- Memory usage (should stay < 200MB)
- CPU usage (< 10% when idle)
- Network requests (minimize API calls)
- UI responsiveness (no blocking operations)

## 🐛 Debugging

### Development Tools

1. **Electron DevTools**: Automatic in dev mode
2. **React DevTools**: Install browser extension
3. **Console Logging**: Extensive debug output
4. **Network Tab**: Monitor API requests

### Common Issues

**Audio not working**:
- Check microphone permissions
- Verify device selection
- Test with different browsers/apps

**Transcription failing**:
- Validate Speech-to-Text service configuration
- Check network connectivity
- Monitor console for WebSocket errors

**AI responses not generating**:
- Verify OpenAI/DeepSeek API key
- Check API quotas/limits
- Review question detection confidence

**Build failures**:
- Clear `node_modules` and reinstall
- Check TypeScript errors
- Verify all dependencies

## 📦 Release Process

### Version Bumping

1. Update `package.json` version
2. Update `CLAUDE.md` with changes
3. Run full test suite
4. Create git tag
5. Build distributables

### Distribution

Electron Builder creates:
- **Windows**: `.exe` installer
- **macOS**: `.dmg` file with code signing
- **Linux**: `.AppImage` portable

## 🤝 Contributing Guidelines

### Pull Request Process

1. **Fork** the repository
2. **Create** feature branch (`feature/my-feature`)
3. **Implement** changes with tests
4. **Run** quality checks:
   ```bash
   pnpm run typecheck
   pnpm run lint
   node test-complete-system.js
   ```
5. **Submit** pull request with description

### Code Review

All PRs require:
- [ ] TypeScript compilation passes
- [ ] No linting errors
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Breaking changes noted

### Issue Reporting

Use GitHub issues with:
- **Bug Report**: Steps to reproduce, expected vs actual
- **Feature Request**: Use case, proposed solution
- **Question**: Clear description of problem

## 📚 Resources

### Documentation
- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://react.dev/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Google Cloud Speech-to-Text Docs](https://cloud.google.com/speech-to-text/docs)
- [OpenAI API Docs](https://platform.openai.com/docs/)

### Tools
- [Zustand State Management](https://zustand-demo.pmnd.rs/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🎉 Recognition

Contributors are recognized in:
- README.md contributor section
- Release notes
- GitHub contributors page
- Special mentions for major features

Thank you for contributing to Interview Assistant! 🚀