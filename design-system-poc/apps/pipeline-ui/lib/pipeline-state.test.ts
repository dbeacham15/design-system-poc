import { describe, it, expect } from 'vitest'
import { createPipelineState, transition } from './pipeline-state'

describe('pipeline state machine', () => {
  it('starts at landing stage', () => {
    const state = createPipelineState()
    expect(state.stage).toBe('landing')
  })

  it('transitions landing → grill when figma read succeeds', () => {
    const state = createPipelineState()
    const next = transition(state, {
      type: 'FIGMA_READ',
      figmaUrl: 'https://figma.com/design/abc',
      componentName: 'Button',
      figmaDesign: { nodes: [] },
    })
    expect(next.stage).toBe('grill')
    expect(next.figmaUrl).toBe('https://figma.com/design/abc')
    expect(next.componentName).toBe('Button')
  })

  it('transitions grill → prop-review when prop surface ready', () => {
    let state = createPipelineState()
    state = transition(state, { type: 'FIGMA_READ', figmaUrl: 'https://figma.com/design/abc', componentName: 'Button', figmaDesign: { nodes: [] } })
    const next = transition(state, { type: 'PROP_SURFACE_READY', propSurface: { componentName: 'Button', props: [] } })
    expect(next.stage).toBe('prop-review')
    expect(next.propSurface).toEqual({ componentName: 'Button', props: [] })
  })

  it('transitions prop-review → building on BUILD_START', () => {
    let state = createPipelineState()
    state = transition(state, { type: 'FIGMA_READ', figmaUrl: 'https://figma.com/design/abc', componentName: 'Button', figmaDesign: { nodes: [] } })
    state = transition(state, { type: 'PROP_SURFACE_READY', propSurface: { componentName: 'Button', props: [] } })
    expect(transition(state, { type: 'BUILD_START' }).stage).toBe('building')
  })

  it('transitions building → preview on BUILD_SUCCESS', () => {
    let state = createPipelineState()
    state = transition(state, { type: 'FIGMA_READ', figmaUrl: 'https://figma.com/design/abc', componentName: 'Button', figmaDesign: { nodes: [] } })
    state = transition(state, { type: 'PROP_SURFACE_READY', propSurface: { componentName: 'Button', props: [] } })
    state = transition(state, { type: 'BUILD_START' })
    const next = transition(state, { type: 'BUILD_SUCCESS', commitSha: 'abc123', preBuildSha: 'def456', storyUrl: 'http://localhost:6006/?path=/story/button--primary' })
    expect(next.stage).toBe('preview')
    expect(next.commitSha).toBe('abc123')
    expect(next.preBuildSha).toBe('def456')
  })

  it('transitions preview → pr-created on APPROVED', () => {
    let state = createPipelineState()
    state = transition(state, { type: 'FIGMA_READ', figmaUrl: 'https://figma.com/design/abc', componentName: 'Button', figmaDesign: { nodes: [] } })
    state = transition(state, { type: 'PROP_SURFACE_READY', propSurface: { componentName: 'Button', props: [] } })
    state = transition(state, { type: 'BUILD_START' })
    state = transition(state, { type: 'BUILD_SUCCESS', commitSha: 'abc123', preBuildSha: 'def456', storyUrl: 'http://localhost:6006' })
    const next = transition(state, { type: 'APPROVED', prUrl: 'https://github.com/dbeacham15/design-system-poc/pull/2' })
    expect(next.stage).toBe('pr-created')
    expect(next.prUrl).toBe('https://github.com/dbeacham15/design-system-poc/pull/2')
  })

  it('transitions preview → grill on REQUEST_CHANGES and pre-seeds feedback message', () => {
    let state = createPipelineState()
    state = transition(state, { type: 'FIGMA_READ', figmaUrl: 'https://figma.com/design/abc', componentName: 'Button', figmaDesign: { nodes: [] } })
    state = transition(state, { type: 'PROP_SURFACE_READY', propSurface: { componentName: 'Button', props: [] } })
    state = transition(state, { type: 'BUILD_START' })
    state = transition(state, { type: 'BUILD_SUCCESS', commitSha: 'abc123', preBuildSha: 'def456', storyUrl: 'http://localhost:6006' })
    const next = transition(state, { type: 'REQUEST_CHANGES', feedback: 'The ghost variant needs a border' })
    expect(next.stage).toBe('grill')
    expect(next.messages.at(-1)?.content).toContain('ghost variant')
  })
})
