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
export const Small: Story = { args: { variant: 'primary', size: 'sm', children: 'Button' } }
export const Large: Story = { args: { variant: 'primary', size: 'lg', children: 'Button' } }
export const Disabled: Story = { args: { variant: 'primary', size: 'md', disabled: true, children: 'Button' } }
export const Loading: Story = { args: { variant: 'primary', size: 'md', loading: true, children: 'Button' } }
export const WithIcon: Story = { args: { variant: 'primary', size: 'md', leftIcon: '→', children: 'Continue' } }
export const FullWidth: Story = { args: { variant: 'primary', size: 'md', fullWidth: true, children: 'Full Width Button' } }
