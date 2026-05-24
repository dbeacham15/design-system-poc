export type AppStage =
  | 'idle'       // landing — full-width chat in landing mode
  | 'grilling'   // active grill conversation — full-width chat in thread mode
  | 'building'   // build in progress — chat + build progress in center
  | 'playground' // component built — left rail + playground center + chat drawer

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

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AppState {
  stage: AppStage
  chatOpen: boolean
  componentName: string
  figmaUrl: string
  figmaDesign: FigmaDesign | null
  figmaImageUrl: string | null
  messages: ChatMessage[]
  propSurface: PropSurface | null
  buildStatuses: string[]
  buildError: string | null
  commitSha: string | null
  preBuildSha: string | null
  prUrl: string | null
  selectedComponent: string | null
}

export type AppAction =
  | { type: 'OPEN_CHAT' }
  | { type: 'CLOSE_CHAT' }
  | { type: 'START_CHAT' }
  | { type: 'SET_FIGMA'; figmaUrl: string; figmaImageUrl: string }
  | { type: 'FIGMA_READY'; figmaUrl: string; componentName: string; figmaDesign: FigmaDesign; figmaImageUrl?: string }
  | { type: 'ADD_MESSAGE'; message: ChatMessage }
  | { type: 'PROP_SURFACE_READY'; propSurface: PropSurface }
  | { type: 'BUILD_START' }
  | { type: 'BUILD_STATUS'; message: string }
  | { type: 'BUILD_SUCCESS'; commitSha: string; preBuildSha: string }
  | { type: 'BUILD_FAIL'; error: string }
  | { type: 'PR_CREATED'; prUrl: string }
  | { type: 'SELECT_COMPONENT'; componentName: string; propSurface: PropSurface | null }
  | { type: 'RESUME_SESSION'; state: AppState }
  | { type: 'RESET' }

export function createAppState(): AppState {
  return {
    stage: 'idle',
    chatOpen: true,
    componentName: '',
    figmaUrl: '',
    figmaDesign: null,
    figmaImageUrl: null,
    messages: [],
    propSurface: null,
    buildStatuses: [],
    buildError: null,
    commitSha: null,
    preBuildSha: null,
    prUrl: null,
    selectedComponent: null,
  }
}

export function transition(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'OPEN_CHAT':
      return { ...state, chatOpen: true }
    case 'CLOSE_CHAT':
      return { ...state, chatOpen: false }
    case 'START_CHAT':
      return { ...state, stage: 'grilling', chatOpen: true }
    case 'SET_FIGMA':
      return { ...state, figmaUrl: action.figmaUrl, figmaImageUrl: action.figmaImageUrl }
    case 'FIGMA_READY':
      return {
        ...state,
        stage: 'grilling',
        figmaUrl: action.figmaUrl,
        componentName: action.componentName,
        figmaDesign: action.figmaDesign,
        figmaImageUrl: action.figmaImageUrl ?? state.figmaImageUrl,
      }
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] }
    case 'PROP_SURFACE_READY':
      return { ...state, propSurface: action.propSurface }
    case 'BUILD_START':
      return { ...state, stage: 'building', buildStatuses: [], buildError: null, commitSha: null, preBuildSha: null }
    case 'BUILD_STATUS':
      return { ...state, buildStatuses: [...state.buildStatuses, action.message] }
    case 'BUILD_SUCCESS':
      return {
        ...state,
        stage: 'playground',
        chatOpen: true,
        commitSha: action.commitSha,
        preBuildSha: action.preBuildSha,
        selectedComponent: state.componentName,
      }
    case 'BUILD_FAIL':
      return { ...state, stage: 'grilling', buildStatuses: [], buildError: action.error, chatOpen: true }
    case 'PR_CREATED':
      return { ...state, prUrl: action.prUrl }
    case 'SELECT_COMPONENT':
      return {
        ...state,
        stage: 'playground',
        selectedComponent: action.componentName,
        componentName: action.componentName,
        propSurface: action.propSurface,
        chatOpen: false,
      }
    case 'RESUME_SESSION':
      return { ...action.state }
    case 'RESET':
      return createAppState()
    default:
      return state
  }
}
