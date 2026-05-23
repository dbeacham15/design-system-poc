'use client'
import { usePipeline } from '@/lib/pipeline-context'
import { useBuildStream } from '@/hooks/useBuildStream'
import { ComponentBrowser } from '@/components/ComponentBrowser'
import { ChatPanel } from '@/components/ChatPanel'
import { Playground } from '@/components/Playground'

export default function Page() {
  const { state } = usePipeline()
  useBuildStream()
  const showPlayground = state.stage === 'playground' || state.stage === 'building'
  const chatWidth = showPlayground && state.chatOpen ? 400 : (state.chatOpen ? '100%' : 0)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <ComponentBrowser />
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {showPlayground
          ? <Playground />
          : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#444', fontSize: 14 }}>Select a component or start a chat to build one.</div>
        }
      </div>
      <div style={{
        width: chatWidth, flexShrink: 0,
        borderLeft: state.chatOpen ? '1px solid #222' : 'none',
        overflow: 'hidden', transition: 'width .25s ease', height: '100%',
      }}>
        {state.chatOpen && <ChatPanel />}
      </div>
    </div>
  )
}
