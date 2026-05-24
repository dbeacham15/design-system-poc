import type { PropSurface } from './pipeline-state'

export function buildGrillSystemPrompt(componentName: string, figmaData: string): string {
  const hasComponent = componentName.length > 0
  const hasFigma = figmaData && figmaData !== '{}'

  const componentSection = hasComponent
    ? `You are currently building: **${componentName}**. Skip to Phase 2 — the component is already established.`
    : `You are in Phase 1. You must establish what is being built before asking any prop questions.`

  const figmaSection = hasFigma
    ? `\nFigma design data (use this as your primary source for variants and visual states):\n${figmaData}\n`
    : ''

  return `You are a design system engineer helping a designer build a React TypeScript component for a living design system.

${componentSection}
${figmaSection}
## Phase 1 — Establish the component (skip if component is already known)

If you do not yet know what component is being built, ask ONE question to establish:
1. What the component is called
2. Its purpose and where it will be used in the product

If a Figma image appears in the conversation: analyze the visual, identify the component type, confirm your reading in one sentence, then move to Phase 2.

Do NOT ask any prop questions until you know the component name and purpose.

## Phase 2 — Resolve the prop surface

Ask ONE question at a time. Do not ask about anything already established in the conversation. Cover all of:
- Visual variants (exact lowercase string values — "primary" not "Primary")
- Sizes (exact string values)
- States: disabled, loading
- Icon support (left icon? right icon? icon-only mode?)
- onClick: optional or required? type="submit" support?
- Any variants not visible in the Figma design (e.g. destructive/danger)
- Full-width option?

After each question, end your message with a suggested answer on its own line:
→ Suggested: [your recommendation]

## Phase 3 — Output the prop surface

When all ambiguities are resolved, output ONLY this block — nothing after [/PROP_SURFACE]:

[PROP_SURFACE]
{"componentName":"${hasComponent ? componentName : 'ComponentName'}","props":[{"name":"variant","type":"\\"primary\\" | \\"secondary\\"","required":true,"defaultValue":null}]}
[/PROP_SURFACE]

Replace the example with the actual resolved props. Use the real component name from the conversation.`
}

export function buildEditSystemPrompt(componentName: string, propSurface: PropSurface | null): string {
  const propsDesc = propSurface
    ? propSurface.props.map(p => `  ${p.name}: ${p.type}`).join('\n')
    : '(props unknown)'

  return `You are helping a designer edit an existing component in a living design system.

Component: ${componentName}

Current prop surface:
${propsDesc}

The designer will describe what they want to change. Ask clarifying questions as needed, then output an updated [PROP_SURFACE] block when ready to rebuild. Keep questions focused — you already know the component, do not re-ask what was already resolved.

End each message with: → Suggested: [your recommendation]`
}

export function extractSuggestion(message: string): string | null {
  const match = message.match(/→\s*Suggested:\s*(.+)$/m)
  return match ? match[1].trim() : null
}

export function extractPropSurface(message: string): PropSurface | null {
  const match = message.match(/\[PROP_SURFACE\]\s*([\s\S]*?)\s*\[\/PROP_SURFACE\]/)
  if (!match) return null
  try {
    return JSON.parse(match[1]) as PropSurface
  } catch {
    return null
  }
}
