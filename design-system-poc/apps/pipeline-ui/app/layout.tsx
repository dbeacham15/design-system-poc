import type { Metadata } from 'next'
import { PipelineProvider } from '@/lib/pipeline-context'
import '../../../src/tokens.css'

export const metadata: Metadata = { title: 'Design System' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ height: '100%' }}>
      <body style={{ height: '100%', margin: 0, background: '#0d0d0d', color: '#f0f0f0', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>
        <PipelineProvider>{children}</PipelineProvider>
      </body>
    </html>
  )
}
