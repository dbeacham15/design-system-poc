import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { ToggleSwitch } from './ToggleSwitch';

const meta: Meta<typeof ToggleSwitch> = {
  title: 'Components/ToggleSwitch',
  component: ToggleSwitch,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    checked: { control: 'boolean' },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    variant: {
      control: 'select',
      options: ['primary', 'success', 'danger'],
    },
    labelPosition: {
      control: 'select',
      options: ['left', 'right'],
    },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    onChange: { action: 'changed' },
  },
};

export default meta;
type Story = StoryObj<typeof ToggleSwitch>;

export const Default: Story = {
  args: {
    checked: false,
    label: 'Enable feature',
    size: 'md',
    variant: 'primary',
    labelPosition: 'right',
  },
};

export const Checked: Story = {
  args: {
    checked: true,
    label: 'Feature enabled',
    size: 'md',
    variant: 'primary',
  },
};

export const Unchecked: Story = {
  args: {
    checked: false,
    label: 'Feature disabled',
    size: 'md',
    variant: 'primary',
  },
};

export const Small: Story = {
  args: {
    checked: true,
    label: 'Small toggle',
    size: 'sm',
    variant: 'primary',
  },
};

export const Medium: Story = {
  args: {
    checked: true,
    label: 'Medium toggle',
    size: 'md',
    variant: 'primary',
  },
};

export const Large: Story = {
  args: {
    checked: true,
    label: 'Large toggle',
    size: 'lg',
    variant: 'primary',
  },
};

export const VariantPrimary: Story = {
  name: 'Variant: Primary',
  args: {
    checked: true,
    label: 'Primary',
    variant: 'primary',
    size: 'md',
  },
};

export const VariantSuccess: Story = {
  name: 'Variant: Success',
  args: {
    checked: true,
    label: 'Success',
    variant: 'success',
    size: 'md',
  },
};

export const VariantDanger: Story = {
  name: 'Variant: Danger',
  args: {
    checked: true,
    label: 'Danger',
    variant: 'danger',
    size: 'md',
  },
};

export const LabelLeft: Story = {
  args: {
    checked: true,
    label: 'Label on left',
    labelPosition: 'left',
    size: 'md',
    variant: 'primary',
  },
};

export const LabelRight: Story = {
  args: {
    checked: true,
    label: 'Label on right',
    labelPosition: 'right',
    size: 'md',
    variant: 'primary',
  },
};

export const NoLabel: Story = {
  args: {
    checked: true,
    size: 'md',
    variant: 'primary',
  },
};

export const Disabled: Story = {
  args: {
    checked: false,
    label: 'Disabled toggle',
    disabled: true,
    size: 'md',
    variant: 'primary',
  },
};

export const DisabledChecked: Story = {
  args: {
    checked: true,
    label: 'Disabled checked',
    disabled: true,
    size: 'md',
    variant: 'primary',
  },
};

export const Loading: Story = {
  args: {
    checked: false,
    label: 'Loading state',
    loading: true,
    size: 'md',
    variant: 'primary',
  },
};

export const LoadingChecked: Story = {
  args: {
    checked: true,
    label: 'Loading checked',
    loading: true,
    size: 'md',
    variant: 'primary',
  },
};

export const FullWidth: Story = {
  args: {
    checked: true,
    label: 'Full width toggle',
    fullWidth: true,
    size: 'md',
    variant: 'primary',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
};

export const AllSizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <ToggleSwitch {...args} size="sm" label="Small" />
      <ToggleSwitch {...args} size="md" label="Medium" />
      <ToggleSwitch {...args} size="lg" label="Large" />
    </div>
  ),
  args: {
    checked: true,
    variant: 'primary',
    onChange: () => {},
  },
};

export const AllVariants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <ToggleSwitch {...args} variant="primary" label="Primary" />
      <ToggleSwitch {...args} variant="success" label="Success" />
      <ToggleSwitch {...args} variant="danger" label="Danger" />
    </div>
  ),
  args: {
    checked: true,
    size: 'md',
    onChange: () => {},
  },
};
