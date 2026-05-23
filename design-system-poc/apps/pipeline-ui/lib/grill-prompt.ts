import type { PropSurface } from './pipeline-state'

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

## When all ambiguities are resolved

Output the prop surface in this EXACT format — nothing after [/PROP_SURFACE]:

[PROP_SURFACE]
{"componentName":"${componentName}","props":[{"name":"variant","type":"\\"primary\\" | \\"secondary\\" | \\"ghost\\"","required":true,"defaultValue":null}]}
[/PROP_SURFACE]

Replace the example with the actual resolved props.`
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
