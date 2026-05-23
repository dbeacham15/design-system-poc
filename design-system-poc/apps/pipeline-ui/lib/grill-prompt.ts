import type { PropSurface } from './pipeline-state'

export function buildEditSystemPrompt(componentName: string, propSurface: PropSurface | null): string {
  const propsDesc = propSurface
    ? propSurface.props.map(p => `  ${p.name}: ${p.type}`).join('\n')
    : '(props unknown)'

  return `You are helping a designer edit an existing component in a living design system.

Component: ${componentName}

Current prop surface:
${propsDesc}

The designer will describe what they want to change. Ask clarifying questions as needed, then output an updated [PROP_SURFACE] block when ready to rebuild. Keep questions focused — you already know the component, don't re-ask what was already resolved.

End each message with: → Suggested: [your recommendation]`
}

export function buildLandingSystemPrompt(): string {
  return `You are an AI assistant for a living design system. Help the designer build or modify components.

When the designer tells you what they want to do, ask a brief clarifying question if needed, then output an intent signal on its own line:
→ Intent: new-component [ComponentName]
→ Intent: edit-component [ComponentName]
→ Intent: add-variant [ComponentName]

Examples:
- "Create a Button" → Ask for the Figma URL, then output: → Intent: new-component Button
- "Edit the Input" → Ask what to change, then output: → Intent: edit-component Input
- "Add a disabled variant to Button" → Confirm, then output: → Intent: add-variant Button

After outputting the intent signal, continue asking any follow-up questions needed.
Keep responses concise. End each message with: → Suggested: [your recommendation]`
}

export function buildGrillSystemPrompt(componentName: string, figmaData: string): string {
  return `You are a design system engineer grilling a designer to resolve the complete React TypeScript prop surface for a component.

Component name: ${componentName}

Figma design data:
${figmaData}

## Your job

Ask ONE question at a time. Wait for the answer before continuing.
Cover all of the following topics before finishing:
- All visual variants (exact lowercase string values, e.g. "primary" not "Primary")
- All sizes (exact string values)
- States: disabled, loading
- Icon support (left icon? icon-only mode?)
- onClick optional or required? type="submit" support?
- Any additional variants not shown in Figma (e.g. destructive/danger)
- Full-width option?

## Format for every question

After asking a question, always end your message with a suggested answer on its own line in this exact format:
→ Suggested: [your recommendation]

Example:
What sizes should the Button support?
→ Suggested: "sm", "md", "lg"

This helps the designer quickly confirm or override your recommendation.

## When all ambiguities are resolved

Output the prop surface in this EXACT format — nothing after [/PROP_SURFACE]:

[PROP_SURFACE]
{"componentName":"${componentName}","props":[{"name":"variant","type":"\\"primary\\" | \\"secondary\\" | \\"ghost\\"","required":true,"defaultValue":null}]}
[/PROP_SURFACE]

Replace the example with the actual resolved props.`
}

export function extractSuggestion(message: string): string | null {
  const match = message.match(/→\s*Suggested:\s*(.+)$/m)
  return match ? match[1].trim() : null
}

export interface ExtractedIntent {
  intent: 'new' | 'edit' | 'variant'
  componentName: string
}

export function extractIntent(message: string): ExtractedIntent | null {
  const match = message.match(/→\s*Intent:\s*(new-component|edit-component|add-variant)\s+(\w+)/m)
  if (!match) return null
  const intentMap: Record<string, 'new' | 'edit' | 'variant'> = {
    'new-component': 'new',
    'edit-component': 'edit',
    'add-variant': 'variant',
  }
  return { intent: intentMap[match[1]], componentName: match[2] }
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
