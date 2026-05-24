'use client'
import { usePipeline } from '@/lib/pipeline-context'
import { useBuildStream } from '@/hooks/useBuildStream'
import { ComponentSidebar } from '@/components/ComponentSidebar'
import { ChatPanel } from '@/components/ChatPanel'
import { Playground } from '@/components/Playground'

export default function Page() {
  const { state } = usePipeline()
  useBuildStream()

  const showPlayground = state.stage === 'playground' || state.stage === 'building'
  // Chat is always visible; when playground is showing it becomes a fixed-width drawer
  const chatWidth = showPlayground
    ? (state.chatOpen ? '400px' : '0px')
    : '100%'

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <ComponentSidebar />
      {showPlayground && (
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <Playground />
        </div>
      )}
      <div style={{
        width: chatWidth,
        flexShrink: 0,
        borderLeft: showPlayground && state.chatOpen ? '1px solid #222' : 'none',
        overflow: 'hidden',
        transition: 'width .25s ease',
        height: '100%',
      }}>
        <ChatPanel />
      </div>
    </div>
  )
}
