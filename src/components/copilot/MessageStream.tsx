'use client'

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useCopilotStore } from '@/stores/copilotStore'
import SystemMessage from './messages/SystemMessage'
import AlertMessage from './messages/AlertMessage'
import StreamingText from './messages/StreamingText'
import PrecedentList from './messages/PrecedentCard'
import RecommendationCard from './messages/RecommendationCard'
import OperatorMessage from './messages/OperatorMessage'
import EscalationQuestion from './messages/EscalationQuestion'

export default function MessageStream() {
  const messages = useCopilotStore((s) => s.messages)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages.length])

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto py-2 min-h-0"
      role="log"
      aria-live="polite"
      aria-label="WATT Co-Pilot messages"
    >
      <AnimatePresence initial={false}>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            {msg.type === 'system' && (
              <SystemMessage content={msg.content ?? ''} timestamp={msg.timestamp} />
            )}
            {msg.type === 'alert' && (
              <AlertMessage
                content={msg.content ?? ''}
                timestamp={msg.timestamp}
                severity={msg.alertSeverity ?? 'warning'}
              />
            )}
            {msg.type === 'streaming' && (
              <StreamingText
                content={msg.content ?? ''}
                timestamp={msg.timestamp}
                isStreaming={msg.isStreaming}
              />
            )}
            {msg.type === 'precedent' && msg.precedents && (
              <PrecedentList precedents={msg.precedents} />
            )}
            {msg.type === 'recommendation' && msg.recommendation && (
              <RecommendationCard
                messageId={msg.id}
                recommendation={msg.recommendation}
                timestamp={msg.timestamp}
              />
            )}
            {msg.type === 'operator' && (
              <OperatorMessage
                content={msg.content ?? ''}
                timestamp={msg.timestamp}
                operatorName={msg.operatorName}
              />
            )}
            {msg.type === 'escalation' && msg.escalationOptions && (
              <EscalationQuestion
                messageId={msg.id}
                content={msg.content ?? ''}
                options={msg.escalationOptions}
                selectedOption={msg.selectedOption}
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
