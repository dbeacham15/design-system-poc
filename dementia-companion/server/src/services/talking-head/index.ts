// server/src/services/talking-head/index.ts
export type { TalkingHeadAdapter, IdleLoopResult, LiveSessionResult, PortraitValidationResult } from './adapter.interface'
export { TalkingHeadError } from './adapter.interface'
export { SimliAdapter, createSimliAdapter } from './simli.adapter'
