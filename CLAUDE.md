# Interview Assistant - AI-Powered Real-time Interview Helper

## Project Overview
Interview Assistant is an Electron-based desktop application that provides real-time AI assistance during interviews. It captures audio from meetings (Slack, Google Meet, etc.), transcribes speech, detects questions, and provides intelligent, context-aware responses.

## Core Architecture

### Technology Stack
- **Frontend**: React 18 with TypeScript
- **UI Framework**: shadcn/ui components with Tailwind CSS
- **Desktop Framework**: Electron
- **Speech Recognition**: AssemblyAI Streaming API
- **AI Responses**: OpenAI API / DeepSeek API
- **State Management**: Zustand
- **Build Tools**: Vite, electron-builder

### Key Features
1. **Real-time Audio Transcription**: Captures both microphone and system audio
2. **Intelligent Question Detection**: Automatically identifies questions in conversation
3. **AI-Powered Responses**: Context-aware answers based on resume and background
4. **Multi-language Support**: Auto-detection and manual language selection
5. **Interview History**: Save and review past interviews
6. **Customizable Settings**: API keys, language preferences, themes

## Application Structure

### UI Layout
```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] Interview Assistant          00:12:34  [Start/End]  │
├─────────────────────┬─────────────────────┬─────────────────┤
│                     │                     │                 │
│  Transcript         │  Active Q&A         │  History        │
│                     │                     │                 │
│  [Real-time text]   │  Q: [Question]      │  Q: Previous    │
│                     │                     │  A: Answer...   │
│  [Ctrl+Shift hint]  │  A: [AI Response]   │                 │
│  [Mark Question]    │     [Loading...]    │  Q: Earlier     │
│                     │                     │  A: Answer...   │
│  ┌─────────────┐    │                     │                 │
│  │ Meeting UI  │    │                     │  [Auto-scroll]  │
│  │ goes here   │    │                     │                 │
│  └─────────────┘    │                     │                 │
└─────────────────────┴─────────────────────┴─────────────────┘
```

### Component Architecture
- **Toolbar**: Application header with controls
- **TranscriptColumn**: Live audio transcription display
- **ResponseColumn**: Active question and AI response
- **HistoryColumn**: Scrollable Q&A history
- **Settings**: Centralized configuration panel

## API Integrations

### AssemblyAI
- WebSocket connection for streaming transcription
- Real-time speech-to-text with low latency
- Language detection capabilities
- Speaker diarization (future enhancement)

### AI Response Services
- **OpenAI**: GPT-4 for comprehensive responses
- **DeepSeek**: Alternative AI model support
- Streaming response capability
- Context injection (resume, background info)

## Development Guidelines

### Code Style
- TypeScript strict mode enabled
- ESLint + Prettier configuration
- Consistent shadcn/ui component usage
- No animation libraries (CSS transitions only)

### State Management
```typescript
interface AppState {
  interview: {
    isActive: boolean
    startTime: Date | null
    transcript: TranscriptEntry[]
    questions: Question[]
    currentQuestion: Question | null
  }
  settings: {
    apiKeys: APIKeys
    language: string
    theme: 'light' | 'dark'
    audioDevices: AudioDevices
  }
  user: {
    resume: string
    context: string
  }
}
```

### Security Considerations
- API keys stored securely in Electron store
- No sensitive data in renderer process
- Secure IPC communication
- Audio permissions handled properly

## Testing Strategy

### Development Mode Features
1. Mock audio input for testing
2. Simulated question detection
3. API response mocking
4. Keyboard shortcut testing
5. Theme switching verification

### Test Commands
```bash
npm run dev          # Start development mode
npm run test         # Run unit tests
npm run e2e          # Run E2E tests
npm run build        # Build for production
```

## Future Enhancements
- Cloud storage integration
- Team collaboration features
- Analytics dashboard
- Custom AI model training
- Browser extension version
- Mobile companion app

## Environment Variables
```env
VITE_ASSEMBLYAI_API_KEY=your_key_here
VITE_OPENAI_API_KEY=your_key_here
VITE_DEEPSEEK_API_KEY=your_key_here
```

## Performance Targets
- Transcription latency: < 500ms
- Question detection: < 100ms
- AI response start: < 2s
- Memory usage: < 200MB
- CPU usage: < 10% idle

## Deployment
- Auto-updater integration
- Code signing for distribution
- Multi-platform builds (Windows, macOS, Linux)
- Analytics and crash reporting