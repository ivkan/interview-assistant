import React from 'react'
import { cn } from '../utils/cn'

interface AudioLevelIndicatorProps {
  level: number // 0-100
  className?: string
}

export function AudioLevelIndicator({ level, className }: AudioLevelIndicatorProps) {
  const bars = 5
  const activeBar = Math.ceil((level / 100) * bars)

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1 transition-all duration-100",
            i < activeBar ? "bg-green-500" : "bg-muted",
            i === 0 && "h-2",
            i === 1 && "h-3",
            i === 2 && "h-4",
            i === 3 && "h-3",
            i === 4 && "h-2"
          )}
        />
      ))}
    </div>
  )
}