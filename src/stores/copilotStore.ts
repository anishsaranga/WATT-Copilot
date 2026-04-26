'use client'

import { create } from 'zustand'
import type { CopilotMessage, AgentStatus, Recommendation } from '@/lib/types'
import { INITIAL_MESSAGES, JULY10_SCENARIO_STEPS } from '@/lib/mock-data/copilotScenarios'
import { useShiftStore } from './shiftStore'

interface CopilotStore {
  messages: CopilotMessage[]
  agentStatus: AgentStatus
  streamingMessageId: string | null
  isRunningDemo: boolean
  addMessage: (msg: CopilotMessage) => void
  appendStreamingChunk: (id: string, chunk: string) => void
  finalizeStreaming: (id: string) => void
  setAgentStatus: (status: AgentStatus) => void
  approveRecommendation: (messageId: string) => void
  modifyRecommendation: (messageId: string, modified: Partial<Recommendation>) => void
  sendOperatorMessage: (text: string, operatorName?: string) => void
  runDemoScenario: () => void
}

function generateId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export const useCopilotStore = create<CopilotStore>()((set, get) => ({
  messages: INITIAL_MESSAGES,
  agentStatus: 'monitoring',
  streamingMessageId: null,
  isRunningDemo: false,

  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),

  appendStreamingChunk: (id, chunk) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, streamedText: (m.streamedText ?? '') + chunk } : m
      ),
    })),

  finalizeStreaming: (id) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, isStreaming: false } : m
      ),
      streamingMessageId: null,
    })),

  setAgentStatus: (status) => set({ agentStatus: status }),

  approveRecommendation: (messageId) => {
    const operatorName = 'Maria K.'
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId && m.recommendation
          ? {
              ...m,
              recommendation: {
                ...m.recommendation,
                status: 'approved',
                approvedBy: operatorName,
                approvedAt: Date.now(),
              },
            }
          : m
      ),
    }))

    const msg = get().messages.find((m) => m.id === messageId)
    if (msg?.recommendation) {
      useShiftStore.getState().addEvent({
        id: `EVT-${Date.now()}`,
        type: 'operator',
        timestamp: Date.now(),
        title: 'WATT recommendation approved',
        description: msg.recommendation.action,
        operatorId: operatorName,
        approved: true,
        approvedBy: operatorName,
        approvedAt: Date.now(),
      })
    }
  },

  modifyRecommendation: (messageId, modified) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId && m.recommendation
          ? {
              ...m,
              recommendation: {
                ...m.recommendation,
                ...modified,
                status: 'modified',
              },
            }
          : m
      ),
    })),

  sendOperatorMessage: (text, operatorName = 'Maria K.') => {
    const msg: CopilotMessage = {
      id: generateId(),
      type: 'operator',
      timestamp: Date.now(),
      content: text,
      operatorName,
    }
    get().addMessage(msg)
    get().setAgentStatus('analyzing')

    setTimeout(() => {
      get().addMessage({
        id: generateId(),
        type: 'streaming',
        timestamp: Date.now(),
        content: `Analyzing your query: "${text}". Searching historical database...`,
        isStreaming: true,
      })
    }, 600)

    setTimeout(() => get().setAgentStatus('monitoring'), 8000)
  },

  runDemoScenario: () => {
    if (get().isRunningDemo) return
    set({ isRunningDemo: true })
    get().setAgentStatus('alert')

    let totalDelay = 0
    for (const step of JULY10_SCENARIO_STEPS) {
      totalDelay += step.delay
      const delay = totalDelay
      setTimeout(() => {
        const msg = step.message()
        get().addMessage(msg)

        if (msg.type === 'streaming') {
          get().setAgentStatus('analyzing')
        } else if (msg.type === 'recommendation') {
          get().setAgentStatus('drafting')
        }
      }, delay)
    }

    setTimeout(() => {
      set({ isRunningDemo: false })
    }, totalDelay + 2000)
  },
}))
