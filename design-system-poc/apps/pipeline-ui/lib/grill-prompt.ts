import type { PropSurface } from './pipeline-state'

export function buildLandingSystemPrompt(): string {
  return `You are an AI assistant for a living design system. Your job is to understand what the designer wants to do and guide them through it.

When the designer first messages you, determine their intent:
- "new component" or creating something → ask for the component name, then ask for the Figma URL
- "edit [ComponentName]" → acknowledge you'll help edit it, ask what they want to change
- "add variant to [ComponentName]" or similar targeted requests → acknowledge the specific request

Keep responses concise. You're talking to a designer who knows what they want. Don't over-explain.

After determining intent, end your message with a suggestion:
→ Suggested: [your recommendation]`
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

export function extractPropSurface(message: string): PropSurface | null {
  const match = message.match(/\[PROP_SURFACE\]\s*([\s\S]*?)\s*\[\/PROP_SURFACE\]/)
  if (!match) return null
  try {
    return JSON.parse(match[1]) as PropSurface
  } catch {
    return null
  }
}
