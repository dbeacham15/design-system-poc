# Design System POC

Figma-driven component pipeline POC. Vite + React + TypeScript + Storybook.

## Pipeline

To build a component from a Figma design, provide the Figma URL and the `design-from-figma` skill will run automatically.

## Commands

```bash
npm run dev          # Dev server (port 5173)
npm run storybook    # Storybook (port 6006)
npm test             # Vitest (single run)
npm run test:watch   # Vitest (watch mode)
```

## Structure

```
src/
  components/
    Button/
      Button.tsx         # Component implementation
      Button.test.tsx    # Vitest tests
      Button.stories.tsx # Storybook stories
      index.ts           # Re-export
  test/
    setup.ts             # Testing Library setup
```
