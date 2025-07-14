import React, { useEffect, useRef } from 'react'

export function DebugPanel({ name }: { name: string }) {
  const renderCount = useRef(0)
  const mountTime = useRef(Date.now())
  
  useEffect(() => {
    renderCount.current++
    const elapsed = Date.now() - mountTime.current
    
    // Log render count
    console.log(`🔄 ${name} render #${renderCount.current} (${elapsed}ms since mount)`)
    
    // Warn if too many renders
    if (renderCount.current > 10 && elapsed < 1000) {
      console.error(`⚠️ ${name} has rendered ${renderCount.current} times in ${elapsed}ms - possible infinite loop!`)
    }
  })
  
  return null
}