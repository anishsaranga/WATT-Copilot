'use client'

import { motion } from 'motion/react'
import { useStreamingText } from '@/hooks/useStreamingText'
import { formatTimestamp } from '@/lib/formatters'

interface StreamingTextProps {
  content: string
  timestamp: number
  isStreaming?: boolean
}

export default function StreamingText({ content, timestamp, isStreaming }: StreamingTextProps) {
  const { displayedText, isComplete } = useStreamingText(content, 16)
  const showCursor = isStreaming && !isComplete

  return (
    <div className="mx-3 my-2 p-3 rounded bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-mono text-[11px] font-semibold text-[var(--accent-indigo)]">WATT</span>
        <span className="font-mono text-[10px] text-[var(--text-muted)]">
          {formatTimestamp(timestamp, 'HH:mm:ss')}
        </span>
      </div>
      <p className="font-mono text-xs text-[var(--text-secondary)] leading-relaxed">
        {displayedText}
        {showCursor && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.53, repeat: Infinity }}
            className="inline-block w-2 h-3 bg-[var(--accent-cyan)] ml-0.5 align-middle"
            aria-hidden
          />
        )}
      </p>
    </div>
  )
}
