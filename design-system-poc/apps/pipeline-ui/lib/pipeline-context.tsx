'use client'
import { createContext, useContext, useReducer, ReactNode } from 'react'
import { createAppState, transition, AppState, AppAction } from './pipeline-state'

interface PipelineContextValue {
  state: AppState
  dispatch: (action: AppAction) => void
}

const PipelineContext = createContext<PipelineContextValue | null>(null)

export function PipelineProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(transition, undefined, createAppState)
  return <PipelineContext.Provider value={{ state, dispatch }}>{children}</PipelineContext.Provider>
}

export function usePipeline() {
  const ctx = useContext(PipelineContext)
  if (!ctx) throw new Error('usePipeline must be used inside PipelineProvider')
  return ctx
}
