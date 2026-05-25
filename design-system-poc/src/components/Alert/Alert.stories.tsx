import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Alert } from './Alert';

const meta: Meta<typeof Alert> = {
  title: 'Components/Alert',
  component: Alert,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['info', 'success', 'warning', 'error'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
    title: { control: 'text' },
    byline: { control: 'text' },
    fullWidth: { control: 'boolean' },
    onClose: { action: 'closed' },
  },
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Default: Story = {
  args: {
    variant: 'info',
    size: 'md',
    title: 'Alert',
    byline: 'This is a secondary line of supporting text.',
  },
};

export const Info: Story = {
  args: {
    variant: 'info',
    title: 'Info Alert',
    byline: 'This is an informational message.',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    title: 'Success!',
    byline: 'Your action was completed successfully.',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    title: 'Warning',
    byline: 'Please review before proceeding.',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    title: 'Error',
    byline: 'Something went wrong. Please try again.',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    title: 'Small Alert',
    byline: 'A compact alert message.',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    title: 'Large Alert',
    byline: 'A spacious alert message for emphasis.',
  },
};

export const WithCloseButton: Story = {
  args: {
    title: 'Dismissable Alert',
    byline: 'Click the X to close this alert.',
    onClose: () => alert('Closed!'),
  },
};

export const WithIcon: Story = {
  args: {
    variant: 'success',
    title: 'With Icon',
    byline: 'This alert has a custom icon.',
    icon: <span style={{ fontSize: '18px' }}>✓</span>,
  },
};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
    title: 'Full Width Alert',
    byline: 'This alert spans the full width of its container.',
  },
};

export const NoByline: Story = {
  args: {
    title: 'Alert Title Only',
    byline: '',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Alert variant="info" title="Info" byline="Informational message." />
      <Alert variant="success" title="Success" byline="Operation completed." />
      <Alert variant="warning" title="Warning" byline="Check before proceeding." />
      <Alert variant="error" title="Error" byline="Something went wrong." />
    </div>
  ),
};
