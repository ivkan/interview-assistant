#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🎤 Interview Assistant - Complete System Test')
console.log('============================================')

// Check if .env file exists
const envExists = fs.existsSync('.env')
console.log()
console.log('📋 Environment Setup:')
console.log(`   ${envExists ? '✅' : '❌'} .env file exists`)

if (envExists) {
  const envContent = fs.readFileSync('.env', 'utf8')
  const hasAssemblyAI = envContent.includes('VITE_ASSEMBLYAI_API_KEY=') && 
                       !envContent.includes('VITE_ASSEMBLYAI_API_KEY=test_') &&
                       !envContent.includes('VITE_ASSEMBLYAI_API_KEY=""')
  const hasOpenAI = envContent.includes('VITE_OPENAI_API_KEY=') && 
                    !envContent.includes('VITE_OPENAI_API_KEY=test_') &&
                    !envContent.includes('VITE_OPENAI_API_KEY=""')
  
  console.log(`   ${hasAssemblyAI ? '✅' : '⚠️ '} AssemblyAI API key configured`)
  console.log(`   ${hasOpenAI ? '✅' : '⚠️ '} OpenAI API key configured`)
} else {
  console.log('   ℹ️  Run: cp .env.test .env')
  console.log('   ℹ️  Then add your API keys')
}

// Test TypeScript compilation
console.log()
console.log('🔧 Build System:')
try {
  execSync('pnpm run typecheck', { stdio: 'pipe' })
  console.log('   ✅ TypeScript compilation passes')
} catch (e) {
  console.log('   ❌ TypeScript compilation failed')
}

// Test file structure
console.log()
console.log('📁 Core Files Check:')
const coreFiles = [
  'src/renderer/services/assemblyAI.ts',
  'src/renderer/hooks/useAssemblyAI.ts', 
  'src/renderer/hooks/useAudioCapture.ts',
  'src/renderer/components/TranscriptionProvider.tsx',
  'src/renderer/store/settingsStore.ts',
  'src/main/audio/audioCapture.ts',
  'src/main/index.ts'
]

coreFiles.forEach(file => {
  const exists = fs.existsSync(file)
  console.log(`   ${exists ? '✅' : '❌'} ${file}`)
})

console.log()
console.log('🎯 Testing Instructions:')
console.log()
console.log('1. 🔑 Set up API keys:')
console.log('   cp .env.test .env')
console.log('   # Edit .env and add your AssemblyAI API key')
console.log()
console.log('2. 🚀 Start the application:')
console.log('   pnpm run dev')
console.log()
console.log('3. 🎤 Test transcription flow:')
console.log('   • Click "Start Interview"')
console.log('   • Grant microphone permissions')
console.log('   • Watch for green mic icon (audio capturing)')
console.log('   • Watch for blue wifi icon (AssemblyAI connected)')
console.log('   • Speak clearly into microphone')
console.log('   • Observe partial transcripts (blue boxes)')
console.log('   • Observe final transcripts (white boxes)')
console.log()
console.log('4. 🔧 Test error scenarios:')
console.log('   • Disconnect internet → observe reconnection')
console.log('   • Use invalid API key → check error display')
console.log('   • Deny microphone → verify graceful handling')
console.log()
console.log('5. ✅ Success indicators:')
console.log('   • Real-time transcript appears as you speak')
console.log('   • Audio level bars respond to voice')
console.log('   • Connection status shows in header')
console.log('   • Transcripts persist in left column')
console.log()
console.log('🔜 Next Phase - Question Detection:')
console.log('   • Automatic question identification')
console.log('   • Manual question marking (Ctrl+Shift+Q)')
console.log('   • AI response generation')
console.log('   • Context-aware answers')

// Check package.json scripts
console.log()
console.log('📦 Available Commands:')
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  Object.keys(pkg.scripts).forEach(script => {
    console.log(`   pnpm run ${script}`)
  })
} catch (e) {
  console.log('   ❌ Could not read package.json')
}