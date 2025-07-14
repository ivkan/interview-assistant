import React from 'react'
import { MinimalTest } from './components/MinimalTest'
import { ErrorBoundary } from './components/ErrorBoundary'

function TestApp() {
  console.log('TestApp: Rendering')
  
  return (
    <ErrorBoundary>
      <div style={{ minHeight: '100vh', background: '#f0f0f0' }}>
        <h1 style={{ padding: '20px' }}>Test App - Debug White Screen</h1>
        <MinimalTest />
      </div>
    </ErrorBoundary>
  )
}

export default TestApp