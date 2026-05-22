# design-from-figma

Triggered when user provides a Figma URL and wants to build a component from it.

## Pipeline

Execute these steps in order. Do not skip steps. Do not ask "should I continue?" between steps — just execute.

### Step 1 — Read the Figma design

Use the `add_figma_file` tool to read the design at the provided URL. Collect:
- Component name
- All visible variants (e.g. Primary, Secondary, Ghost)
- All visible sizes
- All visible states (default, hover, focus, disabled, loading)
- Color tokens used
- Typography used
- Any icons or slots

### Step 2 — Grill the designer

Ask the designer ONE question at a time. Wait for the answer before continuing.
Resolve every ambiguity before writing any code.

Required questions to ask (adapt wording based on what `add_figma_file` already answered):
1. Is there a `loading` state (spinner replaces content)? If yes, what triggers it?
2. Can the button render with only an icon (no label)? What size is the icon?
3. Is `onClick` always required, or can the button be used as a `<button type="submit">`?
4. Are there additional variants not shown in Figma (e.g. destructive/danger)?
5. What happens on mobile / small screens — does size behavior change?
6. Confirm the full list of valid `variant` values (exact strings, e.g. "primary" not "Primary").
7. Confirm the full list of valid `size` values (exact strings).

### Step 3 — Define the prop surface

Before writing code, state the resolved component API in this format and wait for confirmation:

```
Component: Button
Props:
  variant: "primary" | "secondary" | "ghost" [required]
  size: "sm" | "md" | "lg" [required]
  disabled?: boolean [default: false]
  loading?: boolean [default: false]
  iconOnly?: boolean [default: false]
  children: React.ReactNode [required unless iconOnly]
  onClick?: () => void
  type?: "button" | "submit" | "reset" [default: "button"]

Confirmed? (y to continue, or describe changes)
```

### Step 4 — Write the failing test first

Create `src/components/Button/Button.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button variant="primary" size="md">Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<Button variant="primary" size="md" onClick={onClick}>Click</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button variant="primary" size="md" disabled>Click</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn()
    render(<Button variant="primary" size="md" disabled onClick={onClick}>Click</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('renders as submit button when type is submit', () => {
    render(<Button variant="primary" size="md" type="submit">Submit</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })
})
```

Run: `npm test`
Expected: FAIL — `Cannot find module './Button'`

### Step 5 — Build the component

Create `src/components/Button/Button.tsx` using the resolved prop surface and Figma color/size values.
Create `src/components/Button/index.ts` that re-exports Button.

Run: `npm test`
Expected: All 5 tests PASS.

### Step 6 — Write the Storybook story

Create `src/components/Button/Button.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
}
export default meta
type Story = StoryObj<typeof Button>

export const Primary: Story = { args: { variant: 'primary', size: 'md', children: 'Button' } }
export const Secondary: Story = { args: { variant: 'secondary', size: 'md', children: 'Button' } }
export const Ghost: Story = { args: { variant: 'ghost', size: 'md', children: 'Button' } }
export const Disabled: Story = { args: { variant: 'primary', size: 'md', disabled: true, children: 'Button' } }
export const Small: Story = { args: { variant: 'primary', size: 'sm', children: 'Button' } }
export const Large: Story = { args: { variant: 'primary', size: 'lg', children: 'Button' } }
```

### Step 7 — Preview in Storybook

Tell the designer:
```
Component built. Open Storybook to review:

  npm run storybook

Navigate to Button in the sidebar. Check all stories (Primary, Secondary, Ghost, Disabled, Small, Large).

When done reviewing, come back here and answer: does the component match the Figma design? [y/n]
```

Wait for response.

If `n`: Ask what's wrong. Fix. Re-run tests. Return to Step 7.

### Step 8 — CLI Approval and PR

If `y`:

1. Run tests one final time:
```bash
npm test
```
Expected: All pass.

2. Stage and commit:
```bash
git add design-system-poc/src/components/Button/
git commit -m "feat(design-system-poc): add Button component from Figma design"
```

3. Create the PR:
```bash
gh pr create \
  --title "feat(design-system-poc): Button component — Figma-driven pipeline POC" \
  --body "$(cat <<'EOF'
## Summary

- Proves the Figma → grill → build → Storybook → approve → PR pipeline end-to-end
- Button component built from Figma design via `add_figma_file` tool
- Props surface resolved through grill session with designer
- All variants (primary, secondary, ghost), sizes (sm, md, lg), and states (default, disabled) implemented

## Test plan

- [ ] All Vitest tests pass (`npm test`)
- [ ] Storybook renders all 6 stories without errors (`npm run storybook`)
- [ ] Button visually matches Figma design for all variants
- [ ] Disabled state is non-interactive

🤖 Generated via Figma-driven design pipeline
EOF
)"
```

4. Output the PR URL to the designer.
