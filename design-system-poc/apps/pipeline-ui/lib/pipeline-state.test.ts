import { describe, it, expect } from 'vitest'
import { createAppState, transition } from './pipeline-state'

describe('createAppState', () => {
  it('returns idle stage with chatOpen true', () => {
    const s = createAppState()
    expect(s.stage).toBe('idle')
    expect(s.chatOpen).toBe(true)
    expect(s.messages).toEqual([])
    expect(s.buildStatuses).toEqual([])
    expect(s.propSurface).toBeNull()
    expect(s.selectedComponent).toBeNull()
  })
})

describe('transition', () => {
  it('OPEN_CHAT sets chatOpen true', () => {
    const s = transition({ ...createAppState(), chatOpen: false }, { type: 'OPEN_CHAT' })
    expect(s.chatOpen).toBe(true)
  })

  it('CLOSE_CHAT sets chatOpen false', () => {
    const s = transition(createAppState(), { type: 'CLOSE_CHAT' })
    expect(s.chatOpen).toBe(false)
  })

  it('START_CHAT transitions idle to grilling with chatOpen true', () => {
    const s = transition(createAppState(), { type: 'START_CHAT' })
    expect(s.stage).toBe('grilling')
    expect(s.chatOpen).toBe(true)
  })

  it('FIGMA_READY sets figmaUrl, componentName, figmaDesign', () => {
    const design = { nodes: [] }
    const s = transition(createAppState(), { type: 'FIGMA_READY', figmaUrl: 'https://figma.com', componentName: 'Card', figmaDesign: design })
    expect(s.figmaUrl).toBe('https://figma.com')
    expect(s.componentName).toBe('Card')
    expect(s.figmaDesign).toEqual(design)
    expect(s.stage).toBe('grilling')
  })

  it('ADD_MESSAGE appends message to messages array', () => {
    const msg = { id: '1', role: 'user' as const, content: 'hello' }
    const s = transition(createAppState(), { type: 'ADD_MESSAGE', message: msg })
    expect(s.messages).toHaveLength(1)
    expect(s.messages[0]).toEqual(msg)
  })

  it('ADD_MESSAGE supports system role', () => {
    const msg = { id: '2', role: 'system' as const, content: 'Building…' }
    const s = transition(createAppState(), { type: 'ADD_MESSAGE', message: msg })
    expect(s.messages[0].role).toBe('system')
  })

  it('PROP_SURFACE_READY sets propSurface without changing stage', () => {
    const surface = { componentName: 'Button', props: [] }
    const grilling = { ...createAppState(), stage: 'grilling' as const }
    const s = transition(grilling, { type: 'PROP_SURFACE_READY', propSurface: surface })
    expect(s.propSurface).toEqual(surface)
    expect(s.stage).toBe('grilling') // stage does NOT change
  })

  it('BUILD_START transitions to building and clears statuses', () => {
    const s = transition({ ...createAppState(), buildStatuses: ['old'] }, { type: 'BUILD_START' })
    expect(s.stage).toBe('building')
    expect(s.buildStatuses).toEqual([])
    expect(s.commitSha).toBeNull()
    expect(s.preBuildSha).toBeNull()
  })

  it('BUILD_STATUS appends to buildStatuses', () => {
    const building = { ...createAppState(), stage: 'building' as const, buildStatuses: [] }
    const s = transition(building, { type: 'BUILD_STATUS', message: 'Generating…' })
    expect(s.buildStatuses).toEqual(['Generating…'])
  })

  it('BUILD_SUCCESS transitions to playground and sets selectedComponent', () => {
    const s = transition(
      { ...createAppState(), stage: 'building' as const, componentName: 'Button' },
      { type: 'BUILD_SUCCESS', commitSha: 'abc', preBuildSha: 'def' }
    )
    expect(s.stage).toBe('playground')
    expect(s.commitSha).toBe('abc')
    expect(s.preBuildSha).toBe('def')
    expect(s.selectedComponent).toBe('Button')
    expect(s.chatOpen).toBe(true)
  })

  it('SELECT_COMPONENT transitions to playground with chatOpen false', () => {
    const s = transition(createAppState(), { type: 'SELECT_COMPONENT', componentName: 'Input', propSurface: null })
    expect(s.stage).toBe('playground')
    expect(s.selectedComponent).toBe('Input')
    expect(s.chatOpen).toBe(false)
  })

  it('RESET returns initial state', () => {
    const modified = { ...createAppState(), stage: 'playground' as const, componentName: 'Button', chatOpen: false }
    const s = transition(modified, { type: 'RESET' })
    expect(s).toEqual(createAppState())
  })

  it('PR_CREATED sets prUrl', () => {
    const s = transition(createAppState(), { type: 'PR_CREATED', prUrl: 'https://github.com/pr/1' })
    expect(s.prUrl).toBe('https://github.com/pr/1')
  })

  it('BUILD_FAIL returns to grilling stage and sets chatOpen true', () => {
    const building = { ...createAppState(), stage: 'building' as const, buildStatuses: ['step1'], chatOpen: false }
    const s = transition(building, { type: 'BUILD_FAIL', error: 'Tests failed' })
    expect(s.stage).toBe('grilling')
    expect(s.chatOpen).toBe(true)
    expect(s.buildStatuses).toEqual([])
    expect(s.buildError).toBe('Tests failed')
  })
})
