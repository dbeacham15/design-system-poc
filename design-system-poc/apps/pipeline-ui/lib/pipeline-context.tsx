'use client'
import { createContext, useContext, useReducer, ReactNode } from 'react'
import { createPipelineState, transition, PipelineState, PipelineAction } from './pipeline-state'

interface PipelineContextValue {
  state: PipelineState
  dispatch: (action: PipelineAction) => void
}

const PipelineContext = createContext<PipelineContextValue | null>(null)

export function PipelineProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(transition, undefined, createPipelineState)
  return <PipelineContext.Provider value={{ state, dispatch }}>{children}</PipelineContext.Provider>
}

export function usePipeline() {
  const ctx = useContext(PipelineContext)
  if (!ctx) throw new Error('usePipeline must be used inside PipelineProvider')
  return ctx
}
