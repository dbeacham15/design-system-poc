export type PipelineStage = 'landing' | 'grill' | 'prop-review' | 'building' | 'preview' | 'pr-created'

export interface FigmaDesign {
  nodes: unknown[]
}

export interface PropDefinition {
  name: string
  type: string
  required: boolean
  defaultValue: string | null
}

export interface PropSurface {
  componentName: string
  props: PropDefinition[]
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface PipelineState {
  stage: PipelineStage
  figmaUrl: string
  componentName: string
  figmaDesign: FigmaDesign | null
  messages: Message[]
  propSurface: PropSurface | null
  commitSha: string | null
  preBuildSha: string | null
  storyUrl: string | null
  prUrl: string | null
}

export type PipelineAction =
  | { type: 'FIGMA_READ'; figmaUrl: string; componentName: string; figmaDesign: FigmaDesign }
  | { type: 'PROP_SURFACE_READY'; propSurface: PropSurface }
  | { type: 'BUILD_START' }
  | { type: 'BUILD_SUCCESS'; commitSha: string; preBuildSha: string; storyUrl: string }
  | { type: 'APPROVED'; prUrl: string }
  | { type: 'REQUEST_CHANGES'; feedback: string }

export function createPipelineState(): PipelineState {
  return {
    stage: 'landing',
    figmaUrl: '',
    componentName: '',
    figmaDesign: null,
    messages: [],
    propSurface: null,
    commitSha: null,
    preBuildSha: null,
    storyUrl: null,
    prUrl: null,
  }
}

export function transition(state: PipelineState, action: PipelineAction): PipelineState {
  switch (action.type) {
    case 'FIGMA_READ':
      return { ...state, stage: 'grill', figmaUrl: action.figmaUrl, componentName: action.componentName, figmaDesign: action.figmaDesign }
    case 'PROP_SURFACE_READY':
      return { ...state, stage: 'prop-review', propSurface: action.propSurface }
    case 'BUILD_START':
      return { ...state, stage: 'building', commitSha: null, preBuildSha: null, storyUrl: null }
    case 'BUILD_SUCCESS':
      return { ...state, stage: 'preview', commitSha: action.commitSha, preBuildSha: action.preBuildSha, storyUrl: action.storyUrl }
    case 'APPROVED':
      return { ...state, stage: 'pr-created', prUrl: action.prUrl }
    case 'REQUEST_CHANGES':
      return {
        ...state,
        stage: 'grill',
        propSurface: null,
        messages: [
          ...state.messages,
          { role: 'user', content: `I reviewed the component in Storybook and want changes: ${action.feedback}` },
        ],
      }
    default:
      return state
  }
}
