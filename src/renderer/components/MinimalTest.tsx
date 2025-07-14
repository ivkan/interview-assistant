import React from 'react'
import { useInterviewStore } from '../store/interviewStore'

export function MinimalTest() {
  const { isActive, startInterview, endInterview } = useInterviewStore()
  
  const handleClick = () => {
    console.log('MinimalTest: Button clicked, isActive:', isActive)
    if (isActive) {
      endInterview()
    } else {
      startInterview()
    }
    console.log('MinimalTest: After toggle')
  }
  
  return (
    <div style={{ padding: '20px', background: '#fff', color: '#000' }}>
      <h2>Minimal Test Component</h2>
      <p>Interview Active: {isActive ? 'YES' : 'NO'}</p>
      <button 
        onClick={handleClick}
        style={{ padding: '10px', background: '#007bff', color: '#fff', border: 'none', cursor: 'pointer' }}
      >
        {isActive ? 'Stop' : 'Start'} Interview
      </button>
    </div>
  )
}