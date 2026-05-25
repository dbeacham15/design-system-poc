import path from 'path'
import type { PropSurface } from './pipeline-state'

export interface TokenManifest {
  primitives: Record<string, string>
  semantic: {
    color: Record<string, { light: string; dark: string; description: string }>
    spacing: Record<string, { value: string; description: string }>
    typography: Record<string, { value: string; description: string }>
    radius: Record<string, { value: string; description: string }>
  }
}

export function buildTokenVocabulary(manifest: TokenManifest): string {
  const lines: string[] = [
    'Design tokens (use these CSS variables in inline styles — NEVER hardcode color, spacing, font-size, or radius values):',
    '',
    '### Color tokens (automatically theme-aware — light/dark handled by CSS)',
  ]
  for (const [name, token] of Object.entries(manifest.semantic.color)) {
    lines.push(`  var(--${name}) — ${token.description}`)
  }

  lines.push('', '### Spacing tokens')
  for (const [name, token] of Object.entries(manifest.semantic.spacing)) {
    lines.push(`  var(--${name}) — ${token.description}`)
  }

  lines.push('', '### Typography tokens')
  for (const [name, token] of Object.entries(manifest.semantic.typography)) {
    lines.push(`  var(--${name}) — ${token.description}`)
  }

  lines.push('', '### Border radius tokens')
  for (const [name, token] of Object.entries(manifest.semantic.radius)) {
    lines.push(`  var(--${name}) — ${token.description}`)
  }

  return lines.join('\n')
}

export function componentDir(componentName: string, repoRoot: string): string {
  return path.join(repoRoot, 'src', 'components', componentName)
}

export function buildCodegenPrompt(surface: PropSurface): string {
  const propLines = surface.props
    .map(p => `  ${p.name}${p.required ? '' : '?'}: ${p.type}${p.defaultValue ? ` // default: ${p.defaultValue}` : ''}`)
    .join('\n')

  return `Generate a React TypeScript component. Return ONLY a valid JSON object — no markdown, no explanation, no code fences.

Component: ${surface.componentName}

Props:
${propLines}

Component requirements:
- Use inline React styles (no CSS modules, no Tailwind, no external CSS)
- Named export: export function ${surface.componentName}(...)
- If a loading prop exists: show a CSS spinner, hide children while loading
- If a disabled prop exists: apply 50% opacity, block pointer events
- All TypeScript types must be explicit
- Use single quotes for JSX string attributes (e.g. className='foo') to avoid escaping issues inside JSON strings

Test requirements (Vitest + @testing-library/react):
- Test BEHAVIOUR and STRUCTURE — never assert on specific hex color values or CSS property values in inline styles
- Good things to test: text content renders, aria roles/labels, data-* attributes, conditional rendering (loading spinner, disabled state), children prop content, variant-specific text or class markers
- BAD (will cause flaky failures): expect(element).toHaveStyle('background-color: #e0f2fe') or toContain('#3b82f6')
- If you need to distinguish variants, use a data-variant attribute on the root element and test that

CRITICAL JSON RULES:
- The entire response must be a single valid JSON object — start with { and end with }
- Escape ALL double quotes inside string values as \"
- Encode ALL newlines inside string values as \\n
- Do NOT wrap the JSON in a code fence or add any text outside the JSON object

Return a JSON object with exactly these four keys:
{
  "component": "...full ${surface.componentName}.tsx content...",
  "test": "...full ${surface.componentName}.test.tsx content using Vitest + @testing-library/react...",
  "stories": "...full ${surface.componentName}.stories.tsx content using Storybook 8 Meta/StoryObj...",
  "defaultConfig": { "...propName": "...concreteValue" }
}

The "defaultConfig" value is a plain JSON object (not a string) — a complete set of concrete prop values that will seed the Playground preview. Rules:
- Include every prop that has a visible, meaningful value in the preview
- For array props (e.g. options, items, columns): include 2-4 realistic example items matching the exact TypeScript shape
- For string props: use short, realistic example text (e.g. "Email address" for a label, "Search…" for placeholder)
- For enum/union props: pick the most common or visually interesting value
- For boolean props: use the value that makes the component look most complete in a preview
- Omit callback props (onChange, onClick, onClose, etc.)
- Mirror the fixtures used in the test file wherever possible`
}

/**
 * Generates the deterministic index.ts re-export for a component.
 * This is always a single-line barrel export — no LLM needed.
 */
export function buildIndexContent(componentName: string): string {
  return `export { ${componentName} } from './${componentName}'`
}

/**
 * Extracts a JSON object from a raw LLM response that may include:
 * - Markdown code fences  (```json ... ```)
 * - Preamble prose        ("Here is the component:")
 * - Triple backticks inside string values (e.g. MDX docs in Storybook)
 * - Trailing commentary after the closing fence
 *
 * Strategy: locate the outermost { … } in the raw text.
 *
 * This is more robust than a regex that relies on fence boundaries because:
 *   (a) Claude sometimes omits code fences for complex responses, and
 *   (b) code inside JSON string values may contain backtick sequences that
 *       fool a non-greedy fence regex into capturing truncated content.
 */
export function extractJsonFromLLMResponse(text: string): string {
  const trimmed = text.trim()

  // Fast path: response is already a bare JSON object
  if (trimmed.startsWith('{')) return trimmed

  // Extract the outermost { … }
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end > start) {
    return text.slice(start, end + 1)
  }

  // Nothing found — return trimmed as-is so JSON.parse produces a useful error
  return trimmed
}
