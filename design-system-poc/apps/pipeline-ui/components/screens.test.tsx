import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { useEffect } from 'react'
import { PipelineProvider } from '@/lib/pipeline-context'
import { usePipeline } from '@/lib/pipeline-context'
import type { PipelineAction } from '@/lib/pipeline-state'
import { PropSurfaceReview } from './PropSurfaceReview'
import { PrCreated } from './PrCreated'

function WithState({ setup, children }: { setup: (d: (a: PipelineAction) => void) => void, children: React.ReactNode }) {
  const { dispatch } = usePipeline()
  useEffect(() => { setup(dispatch) }, [])
  return <>{children}</>
}

describe('PropSurfaceReview', () => {
  it('renders component name', async () => {
    render(
      <PipelineProvider>
        <WithState setup={d => {
          d({ type: 'FIGMA_READ', figmaUrl: 'http://f.com', componentName: 'Button', figmaDesign: { nodes: [] } })
          d({ type: 'PROP_SURFACE_READY', propSurface: { componentName: 'Button', props: [{ name: 'variant', type: '"primary"', required: true, defaultValue: null }] } })
        }}>
          <PropSurfaceReview />
        </WithState>
      </PipelineProvider>
    )
    await waitFor(() => expect(screen.getByText('Button')).toBeInTheDocument())
  })

  it('renders prop names in the table', async () => {
    render(
      <PipelineProvider>
        <WithState setup={d => {
          d({ type: 'FIGMA_READ', figmaUrl: 'http://f.com', componentName: 'Button', figmaDesign: { nodes: [] } })
          d({ type: 'PROP_SURFACE_READY', propSurface: { componentName: 'Button', props: [{ name: 'variant', type: '"primary"', required: true, defaultValue: null }] } })
        }}>
          <PropSurfaceReview />
        </WithState>
      </PipelineProvider>
    )
    await waitFor(() => expect(screen.getByText('variant')).toBeInTheDocument())
  })
})

describe('PrCreated', () => {
  it('renders View Pull Request link', async () => {
    render(
      <PipelineProvider>
        <WithState setup={d => {
          d({ type: 'FIGMA_READ', figmaUrl: 'http://f.com', componentName: 'Button', figmaDesign: { nodes: [] } })
          d({ type: 'PROP_SURFACE_READY', propSurface: { componentName: 'Button', props: [] } })
          d({ type: 'BUILD_START' })
          d({ type: 'BUILD_SUCCESS', commitSha: 'abc', preBuildSha: 'def', storyUrl: 'http://localhost:6006' })
          d({ type: 'APPROVED', prUrl: 'https://github.com/dbeacham15/design-system-poc/pull/2' })
        }}>
          <PrCreated />
        </WithState>
      </PipelineProvider>
    )
    await waitFor(() => expect(screen.getByRole('link', { name: /view pull request/i })).toBeInTheDocument())
  })
})
