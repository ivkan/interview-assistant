# Electron Legacy Code - Commented Out for Browser Implementation

This file documents the Electron-specific code that was commented out during the browser migration.

## Files Commented Out / Modified

### 1. Main Process Files (Electron-specific)
- `src/main/index.ts` - Main Electron process
- `src/main/preload.ts` - Preload script for renderer communication
- `src/main/audio/audioCapture.ts` - Electron audio capture implementation
- `src/main/ipc/handlers.ts` - IPC handlers for main-renderer communication

### 2. Renderer Process Updates

#### App.tsx
- **Replaced**: `window.electronAPI` calls with browser-native APIs
- **Replaced**: Global Electron shortcuts with document keyboard listeners
- **Added**: Browser compatibility checks for Speech API and localStorage
- **Added**: Loading settings from browser storage instead of electron-store

#### TranscriptionProvider.tsx
- **Replaced**: `useAudioCapture` and `useSafeAudioCapture` with Web Speech API
- **Replaced**: Electron audio processing with browser speech recognition
- **Added**: Web Speech API event handling and transcript processing

#### Settings Store
- **Replaced**: electron-store persistence with browser localStorage
- **Added**: Encrypted API key storage using browser storage service
- **Modified**: All update methods to sync with browser storage

### 3. New Browser-Only Services

#### webSpeechRecognition.ts
- **Purpose**: Browser-native speech recognition using Web Speech API
- **Features**: 
  - Continuous speech recognition
  - Interim and final results
  - Language support
  - Error handling
  - Microphone permission management

#### browserStorage.ts
- **Purpose**: Browser-based storage with encryption for sensitive data
- **Features**:
  - localStorage with encryption for API keys
  - Settings persistence
  - Interview history storage
  - Data backup/restore functionality

### 4. Removed Dependencies

#### From package.json:
- `electron` - Desktop app framework
- `electron-builder` - App packaging
- `electron-store` - Secure storage
- `vite-plugin-electron` - Vite Electron integration
- `vite-plugin-electron-renderer` - Renderer process integration
- `concurrently` - Process management
- `wait-on` - Dev server coordination

### 5. Key Behavioral Changes

#### Audio Capture
- **Before**: Electron's native audio capture with system audio support
- **After**: Web Speech API with microphone-only support
- **Limitation**: No system audio capture in browser (by design for security)

#### Storage
- **Before**: Electron secure storage with OS-level encryption
- **After**: Browser localStorage with XOR encryption
- **Note**: Browser storage is less secure but suitable for web deployment

#### Shortcuts
- **Before**: Global system shortcuts via Electron
- **After**: Document-level keyboard shortcuts (only when page is focused)

#### Permissions
- **Before**: Electron manages microphone permissions
- **After**: Browser permission API with fallback handling

### 6. Build Configuration Changes

#### package.json Scripts
- **Added**: `dev:browser` - Browser-only development
- **Added**: `build:browser` - Browser-only production build
- **Modified**: Existing scripts to maintain Electron compatibility

#### vite.config.ts
- **Updated**: For browser-only builds
- **Maintained**: Electron build compatibility

### 7. Migration Benefits

1. **No Installation Required**: Runs directly in browser
2. **Cross-Platform**: Works on any OS with modern browser
3. **Easier Deployment**: Static files can be served anywhere
4. **Simplified Development**: No Electron build complexity
5. **Better Security**: Browser sandbox model

### 8. Migration Trade-offs

1. **No System Audio**: Can't capture application audio
2. **Limited Storage**: Browser storage quotas vs unlimited desktop storage
3. **Permissions**: Must request microphone permission each session
4. **Offline Support**: Limited compared to desktop app
5. **Performance**: Slightly less efficient than native app

### 9. Maintaining Electron Compatibility

All Electron code was commented out rather than deleted to maintain the ability to:
- Switch back to Electron if needed
- Support both browser and desktop versions
- Reference original implementation during debugging

### 10. Testing Browser Version

To test the browser version:
```bash
npm run dev:browser  # Development server
npm run build:browser  # Production build
```

The browser version includes compatibility checks and graceful degradation for unsupported browsers.