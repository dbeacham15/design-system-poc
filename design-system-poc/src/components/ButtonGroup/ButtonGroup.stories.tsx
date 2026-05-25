import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ButtonGroup } from './ButtonGroup';

const meta: Meta<typeof ButtonGroup> = {
  title: 'Components/ButtonGroup',
  component: ButtonGroup,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['outlined', 'filled'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
    disabled: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    value: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof ButtonGroup>;

const defaultOptions = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
];

const iconOptions = [
  { label: 'Day', value: 'day', icon: <span>📅</span> },
  { label: 'Week', value: 'week', icon: <span>🗓️</span> },
  { label: 'Month', value: 'month', icon: <span>📆</span> },
];

export const OutlinedDefault: Story = {
  args: {
    variant: 'outlined',
    size: 'md',
    options: defaultOptions,
    value: 'day',
  },
};

export const FilledDefault: Story = {
  args: {
    variant: 'filled',
    size: 'md',
    options: defaultOptions,
    value: 'week',
  },
};

export const SmallSize: Story = {
  args: {
    variant: 'outlined',
    size: 'sm',
    options: defaultOptions,
    value: 'day',
  },
};

export const LargeSize: Story = {
  args: {
    variant: 'outlined',
    size: 'lg',
    options: defaultOptions,
    value: 'month',
  },
};

export const Disabled: Story = {
  args: {
    variant: 'outlined',
    size: 'md',
    options: defaultOptions,
    value: 'day',
    disabled: true,
  },
};

export const FullWidth: Story = {
  args: {
    variant: 'outlined',
    size: 'md',
    options: defaultOptions,
    value: 'week',
    fullWidth: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '600px' }}>
        <Story />
      </div>
    ),
  ],
};

export const WithIcons: Story = {
  args: {
    variant: 'filled',
    size: 'md',
    options: iconOptions,
    value: 'day',
  },
};

export const NoSelection: Story = {
  args: {
    variant: 'outlined',
    size: 'md',
    options: defaultOptions,
  },
};

export const Interactive: Story = {
  render: (args) => {
    const [selected, setSelected] = React.useState('day');
    return (
      <ButtonGroup
        {...args}
        value={selected}
        onChange={(val: string) => setSelected(val)}
      />
    );
  },
  args: {
    variant: 'outlined',
    size: 'md',
    options: defaultOptions,
  },
};
