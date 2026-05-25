import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip } from './Tooltip';

const meta: Meta<typeof Tooltip> = {
  title: 'Components/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['dark', 'light'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
    placement: {
      control: { type: 'select' },
      options: ['top', 'bottom', 'left', 'right'],
    },
    showArrow: {
      control: { type: 'boolean' },
    },
    disabled: {
      control: { type: 'boolean' },
    },
    maxWidth: {
      control: { type: 'text' },
    },
    content: {
      control: { type: 'text' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  args: {
    content: 'This is a tooltip',
    children: <button style={{ padding: '8px 16px', cursor: 'pointer' }}>Hover me</button>,
    variant: 'dark',
    size: 'md',
    placement: 'top',
    showArrow: true,
  },
};

export const LightVariant: Story = {
  args: {
    content: 'Light tooltip variant',
    children: <button style={{ padding: '8px 16px', cursor: 'pointer' }}>Hover me</button>,
    variant: 'light',
    placement: 'top',
    showArrow: true,
  },
};

export const DarkVariant: Story = {
  args: {
    content: 'Dark tooltip variant',
    children: <button style={{ padding: '8px 16px', cursor: 'pointer' }}>Hover me</button>,
    variant: 'dark',
    placement: 'top',
    showArrow: true,
  },
};

export const SmallSize: Story = {
  args: {
    content: 'Small tooltip',
    children: <button style={{ padding: '8px 16px', cursor: 'pointer' }}>Hover me</button>,
    size: 'sm',
  },
};

export const LargeSize: Story = {
  args: {
    content: 'Large tooltip text',
    children: <button style={{ padding: '8px 16px', cursor: 'pointer' }}>Hover me</button>,
    size: 'lg',
  },
};

export const PlacementBottom: Story = {
  args: {
    content: 'Tooltip on bottom',
    children: <button style={{ padding: '8px 16px', cursor: 'pointer' }}>Hover me</button>,
    placement: 'bottom',
  },
};

export const PlacementLeft: Story = {
  args: {
    content: 'Tooltip on left',
    children: <button style={{ padding: '8px 16px', cursor: 'pointer' }}>Hover me</button>,
    placement: 'left',
  },
};

export const PlacementRight: Story = {
  args: {
    content: 'Tooltip on right',
    children: <button style={{ padding: '8px 16px', cursor: 'pointer' }}>Hover me</button>,
    placement: 'right',
  },
};

export const NoArrow: Story = {
  args: {
    content: 'No arrow shown',
    children: <button style={{ padding: '8px 16px', cursor: 'pointer' }}>Hover me</button>,
    showArrow: false,
  },
};

export const Disabled: Story = {
  args: {
    content: 'This tooltip is disabled',
    children: <button style={{ padding: '8px 16px', cursor: 'pointer' }}>Hover me (disabled)</button>,
    disabled: true,
  },
};

export const CustomMaxWidth: Story = {
  args: {
    content: 'This is a very long tooltip text that should be wrapped according to the maxWidth setting you configured',
    children: <button style={{ padding: '8px 16px', cursor: 'pointer' }}>Hover me</button>,
    maxWidth: '150px',
  },
};

export const WithTextChild: Story = {
  args: {
    content: 'Tooltip on text',
    children: <span style={{ textDecoration: 'underline dotted', cursor: 'help' }}>Hover over this text</span>,
    variant: 'light',
    placement: 'bottom',
  },
};
