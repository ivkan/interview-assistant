# Interview Assistant - Browser Version

## Overview
This is the browser-based version of the Interview Assistant application. It provides real-time AI assistance during interviews using Web Speech API for transcription and direct HTTP calls to AI services.

## Features

### ✅ Fully Functional
- **Web Speech API Integration** - Browser-native speech recognition
- **AI Response Generation** - Direct API calls to OpenAI and DeepSeek  
- **Real-time Transcription** - Continuous speech-to-text conversion
- **Question Detection** - Automatic identification of interview questions
- **Interview History** - Local storage of past interviews
- **Settings Management** - API keys, language preferences, user profile
- **Keyboard Shortcuts** - Ctrl+Shift+Q (or Cmd+Shift+Q) to mark questions
- **Browser Storage** - Encrypted local storage for sensitive data

### 🔧 Browser-Specific Features
- **Compatibility Check** - Warns users if browser doesn't support required features
- **Microphone Permissions** - Handles browser permission requests
- **Multiple Language Support** - 16 languages including English, Spanish, French, German, etc.
- **Responsive Design** - Works on desktop and tablet browsers

## Quick Start

### Development
```bash
# Install dependencies
npm install

# Start development server (browser-only)
npm run dev:browser

# Open http://localhost:5173 in your browser
```

### Production Build
```bash
# Build for browser deployment
npm run build:browser

# Preview the build
npm run preview:browser

# Deploy the dist/browser folder to any static hosting service
```

## Browser Requirements

### Required APIs
- **Web Speech API** (Chrome/Edge/Safari)
- **Local Storage** (All modern browsers)
- **Microphone Access** (HTTPS required in production)

### Supported Browsers
- ✅ Chrome 25+
- ✅ Edge 79+
- ✅ Safari 14.1+
- ✅ Firefox (limited speech API support)
- ❌ Internet Explorer

## Configuration

### API Keys
1. Go to Settings → API Keys
2. Add your OpenAI or DeepSeek API key
3. Keys are encrypted and stored locally

### Language Settings
1. Go to Settings → Transcription
2. Select your preferred language
3. Choose from 16 supported languages

### User Profile
1. Go to Settings → Profile
2. Add your resume and background information
3. This context helps generate better AI responses

## Key Differences from Electron Version

### ✅ Benefits
- No installation required
- Runs in any modern browser
- Easy deployment to web servers
- Cross-platform compatibility
- Better security (browser sandbox)

### ⚠️ Limitations
- **No system audio capture** (only microphone)
- **Browser-dependent speech recognition** (quality varies)
- **Limited storage** (browser quotas apply)
- **Requires HTTPS** for microphone access in production
- **No global shortcuts** (only works when page is focused)

## Deployment

### Static Hosting
The browser version builds to static files that can be deployed to:
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront
- Any static web server

### Example Deploy Commands
```bash
# Build for production
npm run build:browser

# Deploy to Netlify
netlify deploy --dir=dist/browser --prod

# Deploy to Vercel
vercel --prod dist/browser

# Deploy to GitHub Pages
gh-pages -d dist/browser
```

## Usage

### Starting an Interview
1. Open the application in your browser
2. Grant microphone permissions when prompted
3. Click "Start Interview" in the toolbar
4. Begin speaking - transcription will appear in real-time

### During the Interview
- Speech is automatically transcribed
- Questions are auto-detected and highlighted
- AI responses are generated for detected questions
- Use Ctrl+Shift+Q to manually mark text as a question
- All Q&A pairs are saved to history

### After the Interview
- Review the complete transcript and responses
- Export the interview data if needed
- All data is saved locally in your browser

## Development

### Project Structure
```
src/
├── renderer/
│   ├── services/
│   │   ├── webSpeechRecognition.ts  # Web Speech API integration
│   │   ├── browserStorage.ts        # Encrypted local storage
│   │   └── aiResponse.ts           # AI API calls
│   ├── components/                  # React components
│   ├── hooks/                      # Custom React hooks
│   └── store/                      # Zustand state management
├── main/                           # Electron code (commented out)
└── ELECTRON_LEGACY.md             # Migration documentation
```

### Building Both Versions
```bash
# Browser version
npm run dev:browser
npm run build:browser

# Electron version (legacy)
npm run dev
npm run build
```

## Troubleshooting

### Speech Recognition Not Working
- Check browser compatibility
- Ensure microphone permissions are granted
- Try refreshing the page
- Test with Chrome for best results

### API Keys Not Saving
- Check if localStorage is enabled
- Clear browser cache and try again
- Ensure you're not in incognito mode

### No Audio Input
- Check microphone permissions in browser
- Ensure HTTPS is used (required for microphone access)
- Try a different browser

## Contributing

When contributing to the browser version:
1. Test in multiple browsers
2. Verify microphone permissions work
3. Check speech recognition in different languages
4. Ensure offline capabilities work properly
5. Test on different screen sizes

## License
Same as main project license.