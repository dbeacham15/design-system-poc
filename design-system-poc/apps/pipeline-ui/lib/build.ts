import path from 'path'
import type { PropSurface } from './pipeline-state'

export function componentDir(componentName: string, repoRoot: string): string {
  return path.join(repoRoot, 'src', 'components', componentName)
}

export function buildCodegenPrompt(surface: PropSurface): string {
  const propLines = surface.props
    .map(p => `  ${p.name}${p.required ? '' : '?'}: ${p.type}${p.defaultValue ? ` // default: ${p.defaultValue}` : ''}`)
    .join('\n')

  return `Generate a React TypeScript component. Return ONLY a valid JSON object — no markdown, no explanation.

Component: ${surface.componentName}

Props:
${propLines}

Requirements:
- Use inline React styles (no CSS modules, no Tailwind, no external CSS)
- Named export: export function ${surface.componentName}(...)
- If a loading prop exists: show a CSS spinner, hide children while loading
- If a disabled prop exists: apply 50% opacity, block pointer events
- All TypeScript types must be explicit

Return a JSON object with these exact keys:
{
  "component": "...full ${surface.componentName}.tsx content...",
  "test": "...full ${surface.componentName}.test.tsx content using Vitest + @testing-library/react...",
  "stories": "...full ${surface.componentName}.stories.tsx content using Storybook 8 Meta/StoryObj...",
  "index": "export { ${surface.componentName} } from './${surface.componentName}'"
}`
}
