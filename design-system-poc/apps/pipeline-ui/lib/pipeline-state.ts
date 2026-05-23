export type AppStage =
  | 'idle'       // landing — full-width chat, no component selected
  | 'grilling'   // active grill conversation — full-width chat
  | 'building'   // build in progress — chat + build progress in center
  | 'playground' // component built — left rail + playground center + chat drawer

export type Intent = 'new' | 'edit' | 'variant' | null

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
  intent: Intent
  componentName: string
  figmaUrl: string
  figmaDesign: FigmaDesign | null
  messages: ChatMessage[]
  propSurface: PropSurface | null
  buildStatuses: string[]
  commitSha: string | null
  preBuildSha: string | null
  prUrl: string | null
  selectedComponent: string | null // component viewed from left rail
}

export type AppAction =
  | { type: 'OPEN_CHAT' }
  | { type: 'CLOSE_CHAT' }
  | { type: 'SET_INTENT'; intent: Intent; componentName?: string }
  | { type: 'FIGMA_READY'; figmaUrl: string; componentName: string; figmaDesign: FigmaDesign }
  | { type: 'ADD_MESSAGE'; message: ChatMessage }
  | { type: 'PROP_SURFACE_READY'; propSurface: PropSurface }
  | { type: 'BUILD_START' }
  | { type: 'BUILD_STATUS'; message: string }
  | { type: 'BUILD_SUCCESS'; commitSha: string; preBuildSha: string }
  | { type: 'PR_CREATED'; prUrl: string }
  | { type: 'SELECT_COMPONENT'; componentName: string; propSurface: PropSurface | null }
  | { type: 'RESET' }

export function createAppState(): AppState {
  return {
    stage: 'idle',
    chatOpen: true,
    intent: null,
    componentName: '',
    figmaUrl: '',
    figmaDesign: null,
    messages: [],
    propSurface: null,
    buildStatuses: [],
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
    case 'SET_INTENT':
      return {
        ...state,
        stage: 'grilling',
        chatOpen: true,
        intent: action.intent,
        componentName: action.componentName ?? state.componentName,
      }
    case 'FIGMA_READY':
      return {
        ...state,
        stage: 'grilling',
        figmaUrl: action.figmaUrl,
        componentName: action.componentName,
        figmaDesign: action.figmaDesign,
      }
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] }
    case 'PROP_SURFACE_READY':
      return { ...state, propSurface: action.propSurface }
    case 'BUILD_START':
      return { ...state, stage: 'building', buildStatuses: [], commitSha: null, preBuildSha: null }
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
    case 'RESET':
      return createAppState()
    default:
      return state
  }
}
