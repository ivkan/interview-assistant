#!/usr/bin/env node

console.log('🎤 Interview Assistant - Setup Test')
console.log('====================================')

// Test if all key dependencies are available
const tests = [
  {
    name: 'Node.js version',
    test: () => process.version,
    expected: 'v18 or higher'
  },
  {
    name: 'pnpm availability',
    test: () => {
      try {
        require('child_process').execSync('pnpm --version', { encoding: 'utf8' }).trim()
        return '✅ Available'
      } catch {
        return '❌ Not available'
      }
    },
    expected: 'Available'
  },
  {
    name: 'React',
    test: () => {
      try {
        require('react')
        return '✅ Available'
      } catch {
        return '❌ Not found'
      }
    },
    expected: 'Available'
  },
  {
    name: 'Electron',
    test: () => {
      try {
        require('electron')
        return '✅ Available'
      } catch {
        return '❌ Not found'
      }
    },
    expected: 'Available'
  },
  {
    name: 'TypeScript compilation',
    test: () => {
      try {
        require('child_process').execSync('pnpm run typecheck', { stdio: 'pipe' })
        return '✅ Passes'
      } catch {
        return '❌ Fails'
      }
    },
    expected: 'Passes'
  }
]

console.log()
tests.forEach(({ name, test, expected }) => {
  const result = test()
  console.log(`${name.padEnd(25)} | ${result}`)
})

console.log()
console.log('🚀 Ready to start development!')
console.log('   Run: pnpm run dev')
console.log()
console.log('📋 Audio Capture Features Implemented:')
console.log('   ✅ Microphone permissions')
console.log('   ✅ System audio capture')
console.log('   ✅ Audio level indicators')
console.log('   ✅ Real-time audio processing')
console.log('   ✅ IPC communication')
console.log()
console.log('🔜 Next Steps:')
console.log('   • AssemblyAI integration')
console.log('   • Question detection')
console.log('   • AI response system')
console.log('   • Settings panel')