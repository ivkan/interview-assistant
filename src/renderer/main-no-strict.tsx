import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

// Test without StrictMode to see if double rendering is the issue
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <App />
)